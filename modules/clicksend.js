const https = require('follow-redirects').https;
const fs = require('fs');
const ISO_DATE_TIME = /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z)/;

function getBasic(credentials) {
    let mix = credentials.username + ":" + credentials.token;
    let result =  Buffer.from(mix).toString('base64');

    return result;
}

function getCSCredentials(yargs) {
    if (yargs.csuser == undefined) {
        // get it from the enviornment
        yargs.csuser = process.env.CLICKSEND_USER
    }

    if (yargs.cstoken == undefined) {
        // get it from the environment
        yargs.cstoken = process.env.CLICKSEND_TOKEN
    }
    let result = { 'username': yargs.csuser, 'token': yargs.cstoken }
    if( yargs.debug ) {
        console.debug( result );
    }

    return result;
}

async function executeGet(path, yargs) {
    debug( 4, "Getting " + path, yargs );
    let basic = getBasic(getCSCredentials(yargs));
    let P = new Promise((resolve, reject) => {
        let options = {
            'method': 'GET',
            'hostname': yargs.cshost,
            'path': path,
            'headers': {
                'Authorization': 'Basic ' + basic,
                'Accept': 'application/json'
            },
            'maxRedirects': 20
        };

        let req = https.request(options, function (res) {
            let chunks = [];

            res.on("data", function (chunk) {
                chunks.push(chunk);
            });

            res.on("end", function (chunk) {
                let body = Buffer.concat(chunks).toString();;
                let j = JSON.parse(body)
                resolve(j);
            });

            res.on("error", function (error) {
                reject(error);
            });
        });

        req.end();
    })

    return P;
}

async function executePostJSON( path, content, yargs ) {
    const data = JSON.stringify(content)
    return await executePost( path, 'applicaiton/json', data, yargs );
}

async function executeSend( path, method, contentType, content, yargs ) {


    debug( 4, "Sending " + method + " to " + yargs.host + yargs.path, yargs );

    let basic = getBasic(getCSCredentials(yargs));

    let P = new Promise((resolve, reject) => {
        let options = {
            'method': method,
            'hostname': yargs.cshost,
            'path': path,
            'headers': {
                'Authorization': 'Basic ' + basic,
                'Accept': 'application/json',
                'Content-Type': contentType,
                'Content-Length': Buffer.byteLength(content)
            },
            'maxRedirects': 20
        };

        let req = https.request(options, function (res) {
            let chunks = [];

            res.on("data", function (chunk) {
                chunks.push(chunk);
            });

            res.on("end", function (chunk) {
                let body = Buffer.concat(chunks).toString();;
                let j = JSON.parse(body)
                resolve(j);
            });

            res.on("error", function (error) {
                reject(error);
            });
        });

        debug( 5, method + " Options : ", yargs );
        debug( 5, options, yargs );
        debug( 5, "\n" + method + " Payload :", yargs );
        debug( 5,  content, yargs );

        req.write(content);
        req.end();
    })
    return P;
}

async function executePost( path, contentType, content, yargs ) {
    return await executeSend( path, 'POST', contentType, content, yargs );
}
async function executePut( path, contentType, content, yargs ) {
    return await executeSend( path, 'PUT', contentType, content, yargs );
}

function output( obj, yargs ) {
    let formatted = undefined;

    if( yargs.output.includes( 'none' ) ) {
        return;
    }

    // format choices : ['pretty', 'raw', 'object' ],
    if( yargs.format === 'pretty' ) {
        formatted = JSON.stringify( obj, null, '\t');
    }
    else if( yargs.format === 'raw' ) {
        formatted = JSON.stringify( obj );
    }
    // Probably wrong - as it truncates data, but it makes for pretty output to console.
    else {
        formatted = obj;
    }
    

    if( yargs.output.includes( 'console' ) ) {
        console.log( formatted );
    }
    if( yargs.output.includes( 'debug' ) ) {
        console.debug( formatted );
    }
    if( yargs.output.includes( 'error' ) ) {
        console.error( formatted );
    }
    if( yargs.output.includes( 'file' ) ) {
        let fileName = yargs.fileName
        fs.writeFile( fileName, formatted.toString(), err => {
            if( err){
                console.error(err);
                return;
            }
        })
    }
}

function debug( level, message, yargs ) {
    if( level <= yargs.debug ) {
        console.debug( message );
    }
}

function isISODate( str ) {

}

module.exports = { executeGet, executePost, executePut, executePostJSON, output, debug, isISODate }