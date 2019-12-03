var TCA6416A = require('node-tca23017');

var tca = new TCA6416A({
  address: 0x20, //all address pins pulled low
  device: '/dev/i2c-1', // Model B
  debug: false
});

/*
  This function blinks 16 LED, each hooked up to an port of the tca23017
*/
var pin = 0;
var max = 16;
var state = false;

var blink = function() {
  if (pin >= max) {
    pin = 0; //reset the pin counter if we reach the end
  }

  if (state) {
    tca.digitalWrite(pin, tca.LOW); //turn off the current LED
    pin++; //increase counter
  } else {
    tca.digitalWrite(pin, tca.HIGH); //turn on the current LED
    console.log('blinking pin', pin);
  }
  state = !state; //invert the state of this LED
};

//define all gpios as outputs
for (var i = 0; i < 16; i++) {
  tca.pinMode(i, tca.OUTPUT);
}

setInterval(blink, 100); //blink all LED's with a delay of 100ms