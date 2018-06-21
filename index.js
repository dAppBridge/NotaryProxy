const https = require('https');
const url = require('url');
const crypto = require('crypto');

const keccak256 = require('js-sha3').keccak256;
const AWS = require('aws-sdk');

const s3 = new AWS.S3({apiVersion: '2006-03-01'});
const REQUEST_TIMEOUT = 20000; // 20s

 // Hashes can be confirmed at: https://emn178.github.io/online-tools/keccak_256.html
let isJsonString = (str) => {
    let s =str.toString();
    try {
        JSON.parse(s);
    } catch (e) {
        return false;
    }
    return true;
}

exports.handler = (event, context, callback) => {

    let options = {};
    var util=require("util");
    let urlObj = new url.parse(event.proxyRequest.request_url);
    

    if(event.proxyRequest.method == "POST" &&
        JSON.stringify(event.proxyRequest.postParams).length > 1) {
        
        if(isJsonString(event.proxyRequest.postParams)){
            options = {
              hostname: urlObj.hostname,
              path: urlObj.path,
              protocol: urlObj.protocol,
              port: urlObj.port || 443,
              method: event.proxyRequest.method,
              timeout: REQUEST_TIMEOUT,
              headers: {
                
                "Content-Type": 'application/json-rpc'//,
                //"Content-Length": event.proxyRequest.postParams.length
              }
            };
        }
        else {
            options = {
              hostname: urlObj.hostname,
              path: urlObj.path,
              protocol: urlObj.protocol,
              port: urlObj.port || 443,
              method: event.proxyRequest.method,
              timeout: REQUEST_TIMEOUT,
              headers: {
                "Content-Type": 'application/x-www-form-urlencoded',
                "Content-Length": event.proxyRequest.postParams.length
              }
            };
        }
        
    } else {
        options = {
          hostname: urlObj.hostname,
          path: urlObj.path,
          protocol: urlObj.protocol,
          port: urlObj.port || 443,
          method: event.proxyRequest.method,
          timeout: REQUEST_TIMEOUT
        };
    }


    const req = https.request(options, (res) => {
        let body = '';

        //console.log('Status:', res.statusCode);
        //console.log('Headers:', JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {

            let processed_body = processBody(
                body,
                event.proxyRequest.request_process.type,
                event.proxyRequest.request_process.value);

            let response_body_hashed = keccak256(processed_body.toString());

            let proxyResponse = {
                request_key: event.proxyRequest.request_key,
                full_body_hash: keccak256(body),
                response_body_hash: response_body_hashed, // response_body = the final output to the client
                response_ts: Date.now()
            }
            // write out the proxyResponse to S3 storage so it can be verified at any point in the future...
            putObjectToS3(event.proxyRequest.request_key, JSON.stringify(proxyResponse));

            console.log('Successfully processed HTTPS response');
            
            let output = {
                request_key: event.proxyRequest.request_key,
                response_hash: response_body_hashed,
                response_plain_txt: processed_body
            };


           callback(null, output);
        });
    });

    req.on('error', callback);
 

    if(event.proxyRequest.method == "POST" &&
        JSON.stringify(event.proxyRequest.postParams).length > 1) {

        if(isJsonString(event.proxyRequest.postParams) ) {
            req.write(event.proxyRequest.postParams);
        } else
            req.write(event.proxyRequest.postParams);
    }

   req.end();
};

let processBody = (in_body, process_type, process_value) => {
    if(process_type == "json_extract"){
        try {
            let jsonBody = JSON.parse(in_body);
            let extractLvls = process_value.split(".");
            let returnData = '';

            let tmpObj = jsonBody[extractLvls[0]];

            if(extractLvls.length > 1) {
                let maxLength = extractLvls.length;
                if(maxLength > 10)
                    maxLength = 10;

                for(let c=1; c< maxLength; c++) {
                    tmpObj = tmpObj[extractLvls[c]];
                }
            }

            if(isJsonString(tmpObj) == false)
                returnData = tmpObj;
            else{
                returnData = JSON.parse(tmpObj);
            }

            return returnData;

        }catch(e){
            return in_body;
        }

    } else {
        return in_body;
    }
}

let putObjectToS3 = (request_key, in_data) => {    
    var params = {
        Bucket : 'notaryproxy-audit',
        Key : request_key,
        Body : in_data,
        ACL:'public-read'
    }
    s3.putObject(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else     console.log(data);           // successful response
    });
}


