const util = require('util');
const events = require('events');
const dgram = require('dgram');
const jspack = require('jspack').jspack;

// jspack table for message format: (https://github.com/pgriess/node-jspack)
//
// Format | C Type         | JavaScript Type   | Size (octets) | Notes
//     -------------------------------------------------------------------
//        A   | char[]         | Array             |     Length     |  (1)
//        x   | pad byte       | N/A               |        1       |
//        c   | char           | string (length 1) |        1       |  (2)
//        b   | signed char    | number            |        1       |  (3)
//        B   | unsigned char  | number            |        1       |  (3)
//        h   | signed short   | number            |        2       |  (3)
//        H   | unsigned short | number            |        2       |  (3)
//        i   | signed long    | number            |        4       |  (3)
//        I   | unsigned long  | number            |        4       |  (3)
//        l   | signed long    | number            |        4       |  (3)
//        L   | unsigned long  | number            |        4       |  (3)
//        s   | char[]         | string            |     Length     |  (2)
//        f   | float          | number            |        4       |  (4)
//        d   | double         | number            |        8       |  (5)

// Packet Format of ArtNet Packet According to https://en.wikipedia.org/wiki/Art-Net
const msgFormatHeader = '!7sBHHBBHH';
// // Payload is between 2 and 512, so this is the maximal payload (can be trimmed later if necessary)
const msgFormatMaxPayload = 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB';

// ArtNet server class
module.exports.listen = (port, cb) => {
	this.port = port;
	events.EventEmitter.call(this);
	// Set up the socket
	const sock = dgram.createSocket('udp4', (msg, peer) => {
		// Unpack the message

		// Protocol Data
		const unpacked = jspack.Unpack(msgFormatHeader, msg, 0);
		if(unpacked){

		const signature = unpacked[0];		// Signature should be 'Art-Net'
		const zero = unpacked[1];				// It's just a zero per the format definition ;-)
		const opcode = unpacked[2];			// Opcode is defined to be 0x5000
		const protocolVersion = unpacked[3];	// Protocol Version should be 14

		// TODO: Check for valid Header?

		// ArtNet Data
		const sequence = unpacked[4];
		const physical = unpacked[5];
		const universe = unpacked[6];
		const length = unpacked[7];

		// Unpack the payload
		// Payload is of variable length between 2 and 512, so the package format maybe has to be shorthened
		const payloadFormat = msgFormatMaxPayload.substring(0, length);

		const channelData = jspack.Unpack(payloadFormat, msg, 18);
		// Build the associative array to return
		const retData = {
			'sequence': sequence,
			'physical': physical,
			'universe': universe,
			'length': length,
			data: channelData
		};

		// And call the callback passing the deseralized data
		cb(retData, peer);
		}
	});
	sock.bind(port);
};

// Setup EventEmitter for the ArtNetServer
// util.inherits(this, events.EventEmitter);
