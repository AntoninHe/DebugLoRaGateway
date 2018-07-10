'use strict';
let PORT = 1700;
let HOST = '0.0.0.0';

let stateKey = 1;

const dgram = require('dgram');
const beautify = require('js-beautify').js;
const lora_packet = require('lora-packet');

const fs = require('fs');
const async = require('async');

const promisify = require('util').promisify;
const readFileP = promisify(fs.readFile);

const tsFormat = () => (new Date()).toLocaleTimeString();

let server = dgram.createSocket('udp4');

server.on('listening', function () {
	let address = server.address();
	console.log('UDP Server listening on ' + address.address + ":" + address.port);
});

let i=0;
server.on('message', function (message, remote) {

	let myString = "\n" + tsFormat() + "\n";
	let str = message;

	myString += "reception n° : " + i + "\n" + "send by : " + remote.address + " port : " + remote.port ;

	let index = str.indexOf('rxpk');
	if(index == -1) {
		index = str.indexOf('stat');
		let str_status = str.slice(index-2).toString();
		myString += "\n" + beautify(str_status) ;
	}
	else
	{
            let str_status = str.slice(index-2).toString();
            let json_status = JSON.parse(str_status);
            myString += "\n" + beautify(str_status) + "\n";
            let data = new Buffer(json_status.rxpk[0].data, 'base64');  


            let packet = lora_packet.fromWire(new Buffer.from(data, 'base64'));

            myString += "\n\t" + "Decrypted (ASCII)='" + lora_packet.decrypt(packet, AppSKey, NwkSKey).toString() + "'" + "\n";
	}


	let str_header =  (new Buffer(str.slice(0,24),'hex')).toString('hex');

	myString += "\n\t" + "protocol version : " + str_header.slice(0,2)
	+ "\n\t" + "random token : " + str_header.slice(2,6)
	+ "\n\t" + "PUSH_DATA identifier : " + str_header.slice(6,8)
	+ "\n\t" + "Gateway unique identifier (MAC address) : " + str_header.slice(8,24);

	console.log(myString);
	i++;
});

      function sleep(delay) {
        var start = new Date().getTime();
        while (new Date().getTime() < start + delay);
      }


let NwkSKey ;
let AppSKey ;
async.map(['NwkSKey.txt','AppSKey.txt'], async (item) => {
        console.log(item);
        try {
            const data = await readFileP(item,'utf8')
            return new Buffer(data , 'hex');
        } catch (err) {
            console.log('Maybe no file');
            throw err
        }
    }, (err, results) => {
        if (err) throw err
        [NwkSKey,AppSKey] = results;
        server.bind(PORT, HOST);
})
