const cs = require('../../modules/clicksend.js')

/**
 ** Exports for the command line processor
 **/

exports.command = 'send';
exports.desc = "Send an SMS";
exports.handler = function (yargs) {
    sendSMS(yargs);
}

exports.builder = function (yargs) {
    yargs
        .option('to', {
            describe: 'To whom this message should be sent.  A mobile phone number in E.164 format',
            type: 'array',
            requiresArg: true,
            demandOption: true,
            group: 'SMS Send Options:'
        })
        .option('from', {
            describe: 'Your sender ID.  If none specified, then a shared number is used.  If a non-phone-nuber is used, no reply option is available to the recipient.',
            type: 'string',
            requiresArg: true,
            demandOption: false,
            group: 'SMS Send Options:'
        })
        .option('body', {
            describe: 'Your message.  Note that long messages may be sent in multiple parts.',
            type: 'string',
            requiresArg: true,
            demandOption: true,
            group: 'SMS Send Options:'
        })
        // .option('schedule', {
        //     describe: "When to send this message, in ISO format.  e.g. 'YYYY-MM-DD HH:MM', where HH is in 24 hour format in your 
        // }
}

exports.handler = async function (yargs) {
    let payload = {}
    payload.messages = new Array();
    if( Array.isArray(yargs.to)) {
        for( let i = 0; i < yargs.to.length; i++ ) {
            let message = {
                to: yargs.to[i],
                from: yargs.from,
                source : 'CLI',
                body : yargs.body
            }            
            payload.messages.push( message );
        }
    }
    else {
        let message = {
            to: yargs.to,
            from: yargs.from,
            source : 'CLI',
            body : yargs.body
        }            
        payload.messages.push( message );
    }

    const result = await cs.executePostJSON('/v3/sms/send', payload, yargs);
    cs.output( result, yargs );
    return result;
}
