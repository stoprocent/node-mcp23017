const i2c = require('i2c-bus');

const REGISTER_GPIOA = 0x06,
      REGISTER_GPIOB = 0x07,
      REGISTER_GPIOA_PULLUP = 0x03;
      REGISTER_GPIOB_PULLUP = 0x04;
      READ_GPIOA_ADDR = 0x00,
      READ_GPIOB_ADDR = 0x01,
      WRITE_GPIOA_ADDR = 0x02,
      WRITE_GPIOB_ADDR = 0x03;

var TCA6416A = (function() {
  TCA6416A.prototype.HIGH = 1;
  TCA6416A.prototype.LOW = 0;
  TCA6416A.prototype.INPUT_PULLUP = 2;
  TCA6416A.prototype.INPUT = 1;
  TCA6416A.prototype.OUTPUT = 0;

  TCA6416A.prototype.address = 0x20; //if the mcp has all adress lines pulled low

  TCA6416A.prototype.dirAState = 0xff; //initial state of GPIO A bank
  TCA6416A.prototype.dirBState = 0xff; //initial state of GPIO B bank

  TCA6416A.prototype.dirAPullUpState = 0x0; //initial state of GPIO A pull up resistor state
  TCA6416A.prototype.dirBPullUpState = 0x0; //initial state of GPIO B pull up resistor state

  TCA6416A.prototype.gpioAState = 0xff; //initial state of GPIOS A
  TCA6416A.prototype.gpioBState = 0xff; //initial state of GPIOS B

  function TCA6416A (config) {
    this.address = config.address;
    this.mode = this.INPUT;
    this.debug = config.debug === true ? true : false;
    this.device = config.device !== null ? config.device : 1;
    this.wire = i2c.openSync(this.device); 
    
    this._initGpioA();
    this._initGpioB();
  }

  //inits both registers as an input
  TCA6416A.prototype.reset = function () {
    this.dirBState = 0xff;
    this.dirAState = 0xff;
    this._initGpioA();
    this._initGpioB();
  };

  /*
    sets an pin as an INPUT or OUTPUT
  */
  TCA6416A.prototype.pinMode = function (pin, dir) {
    if (dir !== this.INPUT && dir !== this.INPUT_PULLUP && dir !== this.OUTPUT) {
      console.error('invalid value', dir);
      return;
    }
    if (isNaN(pin)) {
      console.error('pin is not a number:', pin);
      return;
    } else if (pin > 15 || pin < 0) {
      console.error('invalid pin:', pin);
    }

    //delegate to funktion that handles low level stuff
    this._setGpioDir(pin >= 8 ? pin - 8 : pin, dir, pin >= 8 ? REGISTER_GPIOB : REGISTER_GPIOA, pin >= 8 ? REGISTER_GPIOB_PULLUP : REGISTER_GPIOA_PULLUP);
  };

  /*
    internally used to set the direction registers
  */
  TCA6416A.prototype._setGpioDir = function (pin, dir, registerDirection, registerPullUp) {
    var pinHexMask = Math.pow(2, pin),
        registerDir,
        registerPullUpDir;

    if (registerDirection === REGISTER_GPIOA) {
      registerDir = this.dirAState;
      if (dir === this.OUTPUT) {
        if ((this.dirAState & pinHexMask) === pinHexMask) {
          this.log('setting pin \'' + pin + '\' as an OUTPUT');
          this.dirAState = this.dirAState ^ pinHexMask;
          registerDir = this.dirAState;
        } else {
          this.log('pin \'' + pin + '\' already an OUTPUT');
        }
      } else if (dir === this.INPUT || dir === this.INPUT_PULLUP) {
        if ((this.dirAState & pinHexMask) !== pinHexMask) {
          this.log('setting pin \'' + pin + '\' as an INPUT');
          this.dirAState = this.dirAState ^ pinHexMask;
          registerDir = this.dirAState;
        } else {
          this.log('pin \'' + pin + '\' already an INPUT');
        }
        if (dir === this.INPUT_PULLUP) {
           registerPullUpDir = this.dirAPullUpState;
           if ((this.dirAPullUpState & pinHexMask) !== pinHexMask) {
              this.log('activate INPUT_PULLUP for pin \'' + pin + '\'');
              this.dirAPullUpState = this.dirAPullUpState ^ pinHexMask;
              registerPullUpDir = this.dirAPullUpState;
           } else {
              this.log('pin \'' + pin + '\' already activated INPUT_PULLUP');
           }
        }
      }
    } else if (registerDirection === REGISTER_GPIOB) {
      registerDir = this.dirBState;
      if (dir === this.OUTPUT) {
        if ((this.dirBState & pinHexMask) === pinHexMask) {
          this.log('setting pin \'' + pin + '\' as an OUTPUT');
          this.dirBState = this.dirBState ^ pinHexMask;
          registerDir = this.dirBState;
        } else {
          this.log('pin \'' + pin + '\' already an OUTPUT');
        }
      } else if (dir === this.INPUT || dir === this.INPUT_PULLUP) {
        if ((this.dirBState & pinHexMask) !== pinHexMask) {
          this.log('setting pin \'' + pin + '\' as an INPUT');
          this.dirBState = this.dirBState ^ pinHexMask;
          registerDir = this.dirBState;
        } else {
          this.log('pin \'' + pin + '\' already an INPUT');
        }
        if (dir === this.INPUT_PULLUP) {
           registerPullUpDir = this.dirBPullUpState;
           if ((this.dirBPullUpState & pinHexMask) !== pinHexMask) {
              this.log('activate INPUT_PULLUP for pin \'' + pin + '\'');
              this.dirBPullUpState = this.dirBPullUpState ^ pinHexMask;
              registerPullUpDir = this.dirBPullUpState;
           } else {
              this.log('pin \'' + pin + '\' already activated INPUT_PULLUP');
           }
        }
      }
    }

    this._send(registerDirection, [registerDir]);
    this.log('pin:  ' + pin + ', register: ' + registerDirection + ', value: ' + registerDir);

    if(registerPullUpDir !== undefined){
        this._send(registerPullUp, [registerPullUpDir]);
        this.log('pin:  ' + pin + ', register: ' + registerPullUp + ', pull up value: ' + registerPullUpDir);
    }
  };

  TCA6416A.prototype._setGpioAPinValue = function (pin, value) {
    var pinHexMask = Math.pow(2, pin);
    if (value === 0) {
      if ((this.gpioAState & pinHexMask) === pinHexMask) {
        this.gpioAState = this.gpioAState ^ pinHexMask;
        this._send(WRITE_GPIOA_ADDR, [this.gpioAState]);
      }
    }
    if (value === 1) {
      if ((this.gpioAState & pinHexMask) !== pinHexMask) {
        this.gpioAState = this.gpioAState ^ pinHexMask;
        this._send(WRITE_GPIOA_ADDR, [this.gpioAState]);
      }
    }
  };

  TCA6416A.prototype._setGpioBPinValue = function (pin, value) {
    var pinHexMask = Math.pow(2, pin);
    if (value === 0) {
      if ((this.gpioBState & pinHexMask) === pinHexMask) {
        this.gpioBState = this.gpioBState ^ pinHexMask;
        this._send(WRITE_GPIOB_ADDR, [this.gpioBState]);
      }
    }
    if (value === 1) {
      if ((this.gpioBState & pinHexMask) !== pinHexMask) {
        this.gpioBState = this.gpioBState ^ pinHexMask;
        this._send(WRITE_GPIOB_ADDR, [this.gpioBState]);
      }
    }
  };

  var allowedValues = [0, 1, true, false];
  TCA6416A.prototype.digitalWrite = function (pin, value) {
    if (allowedValues.indexOf(value) < 0) {
      console.error('invalid value', value);
      return;
    } else if (value === false) {
      value = this.LOW;
    } else if (value === true) {
      value = this.HIGH;
    }

    if (isNaN(pin)) {
      console.error('pin is not a number:', pin);
      return;
    } else if (pin > 15 || pin < 0) {
      console.error('invalid pin:', pin);
    } else if (pin < 8 ) {
      //Port A
      this._setGpioAPinValue(pin, value);
    } else {
      //Port B
      pin -= 8;
      this._setGpioBPinValue(pin, value);
    }
  };

  TCA6416A.prototype.digitalRead = function (pin, callback) {
    var register = pin >= 8 ? READ_GPIOB_ADDR : READ_GPIOA_ADDR; //get the register to read from
    pin = pin >= 8 ? pin - 8 : pin; //remap the pin to internal value
    var pinHexMask = Math.pow(2, pin); //create a hexMask

    //read one byte from the right register (A or B)
    this._read(register, 1, function (err, registerValue) {
      if (err) {
        console.error(err);
        callback(err, null);
      } else if ((registerValue & pinHexMask) === pinHexMask) {
        //Check if the requested bit is set in the byte returned from the register
        callback(null, true);
      } else {
        callback(null, false);
      }
    });

  };

  TCA6416A.prototype.digitalReadSync = function (pin) {
    var register = pin >= 8 ? READ_GPIOB_ADDR : READ_GPIOA_ADDR; //get the register to read from
    pin = pin >= 8 ? pin - 8 : pin; //remap the pin to internal value
    var pinHexMask = Math.pow(2, pin); //create a hexMask

    //read one byte from the right register (A or B)
    let registerValue = this._readSync(register);
    return ((registerValue & pinHexMask) === pinHexMask);
  };

  TCA6416A.prototype._initGpioA = function () {
    this._send(REGISTER_GPIOA, [this.dirAState]); //Set Direction to Output
    this._send(WRITE_GPIOA_ADDR, [0x0]); //clear all output states
  };

  TCA6416A.prototype._initGpioB = function () {
    this._send(REGISTER_GPIOB, [this.dirBState]); //Set Direction to Output
    this._send(WRITE_GPIOB_ADDR, [0x0]); //clear all output states
  };

  TCA6416A.prototype._send = function (cmd, values) {
    this._sendSync(cmd, values);
  };

  TCA6416A.prototype._read = function (cmd, length, callback) {

    this.wire.readByte(this.address, cmd, (error, result) =>{
      if (err) {
        console.error(err);
        callback(error, null);
      } else {
        callback(null, result);
      }
    });
  };

  TCA6416A.prototype._sendSync = function (cmd, values) {
    this.wire.writeByteSync(this.address, cmd, values[0]);
  };

  TCA6416A.prototype._readSync = function (cmd, callback) {
    return this.wire.readByteSync(this.address, cmd);
  };

  TCA6416A.prototype.log = function (msg) {
    if (this.debug) {
      console.log(msg);
    }
  };

  return TCA6416A;

})();

module.exports = TCA6416A;
