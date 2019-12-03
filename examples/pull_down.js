var TCA6416A = require('node-tca6416a');

var tca = new TCA6416A({
  address: 0x20, //all address pins pulled low
  device: '/dev/i2c-1', // Model B
  debug: false
});

tca.pinMode(0, tca.INPUT_PULLUP);
tca.pinMode(1, tca.INPUT_PULLUP);
tca.pinMode(2, tca.INPUT_PULLUP);
tca.pinMode(3, tca.INPUT_PULLUP);
tca.pinMode(4, tca.INPUT_PULLUP);
tca.pinMode(5, tca.INPUT_PULLUP);
tca.pinMode(6, tca.INPUT_PULLUP);
tca.pinMode(7, tca.INPUT_PULLUP);
tca.pinMode(8, tca.INPUT_PULLUP);
tca.pinMode(9, tca.INPUT_PULLUP);
tca.pinMode(10, tca.INPUT_PULLUP);
tca.pinMode(11, tca.INPUT_PULLUP);
tca.pinMode(12, tca.INPUT_PULLUP);
tca.pinMode(13, tca.INPUT_PULLUP);
tca.pinMode(14, tca.INPUT_PULLUP);
tca.pinMode(15, tca.INPUT); // this one should float from time to time

setInterval(function(){

var test = function(i){
        return function(err, value){
            if(value == false){
                console.log("Pull down on pin " + i, value);
            }
        }
}

for (var i = 8; i < 16; i++) {
  tca.digitalRead(i, test(i));
}
