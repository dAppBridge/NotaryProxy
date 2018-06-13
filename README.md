# Notary Proxy - 3rd party validation & proof of online content

Notary Proxy is a simple Middleware that when used in an audit-able environment can verify and prove that content received has not been tampered with.  For each request made it validates and provides a secure proof of the content received, as it is received from the source endpoint.

Notary Proxy is used within the dAppBridge Ethereum Oracle to provide verifiable proofs that all data returned is valid and has not been tampered with along the chain of requests.

Other potential uses include validating automated API requests. E.g. When relying on a service that retrieves price data from a remote 3rd party API endpoint how can you be sure the data it provides has not been altered during transit?  By Using Notary Proxy as the trusted intermediary every piece of data returned comes with a validation proof.

## How it works

The Notary Proxy works as a middleware, sitting between you and the actual destination of your request.  By being hosted as a validated authority NotaryProxy is able to prove that the content received (And passed on to 3rd parties) was served from the destination host.

The production code runs as a AWS Lambda service... with the package available for you to audit with digital proofs that it has not been altered.


### Access data through the Notary Proxy

To access the Notary Proxy you require a API Key, please contact dapps@dappbridge.com for information.

**API Endpoint**
https://2mik4ebsc1.execute-api.us-east-1.amazonaws.com/prod

**Header**
Add the following to your header:

```
x-api-key: [Your API Key]
```

Method: POST

Request Format (JSON):

```
{
	"proxyRequest": {
		"request_key": STRING,
		"request_url": STRING,
		"method": STRING,
		"postParams": STRING,
		"request_process": {
			"type": "json_extract",
			"value": STRING
		} 
	}
}
```

Where:
request_key = A unique key for this request... this will be passed back to you in the response.

request_url = Full [https://../path] URL that you wish to request

method = GET or POST

postParams = If you are using POST then you can supply a full form encoded body to be posted here

request_process = Option, allows you to have the returned content JSON parsed and an individual element extracted.


Example:

```
{
	"proxyRequest": {
		"request_key": "9e039514-2aa4-4b4d-87fa-2b5c32caf5ce",
		"request_url": "https://api.coindesk.com/v1/bpi/currentprice.json",
		"method": "GET",
		"postParams": "",
		"request_process": {
			"type": "json_extract",
			"value": "bpi.USD.rate"
		} 
	}
}
 ```

 This returns:

```
{
		"request_key":"9e039514-2aa4-4b4d-87fa-2b5c32caf5ce",
		"response_hash":"57ed58d524d5bf3901047938b73ae10e1cb96f3c7242f810b3bae27b4d228984",
		"response_plain_txt":"6,389.7438"
}
```

Where:

response_hash = A sha256 hash of the final output (To be used for validation that nothing has been altered)

response_plain_txt = The final, processed output - in this case we have extracted the JSON elemnt bpi.USD.rate


**Digital Proof**

You would then pass the response + the response_hash onto your customer.  The customer can then be sure that the result you've supplied (6,389.7438) has not been tampered with by you by checking the response_hash (See below for validation procedure)


### Proving the Data is Correct

Notary Proxy runs as an AWS Lambda endpoint, using v1.0.0 of the NotaryProxy service.  This allows you to audit the source code (Via github) and then audit that the live production version is using this same version and has not been modified.

**To get the current source code Hash**

1. Download the latest release package from:
https://github.com/dAppBridge/NotaryProxy/blob/master/Release/v1.0.0/NotaryProxy-1.0.0.zip

2. Use a 3rd party SHA256 gnerator to get the full package hash, we suggest something like:
https://hash.online-convert.com/sha256-generator
- This will let you upload the full archive and create the SHA256 hash of the archive

3. Make a note of the **base64** result of the hash, we'll compare this against the hash of the currently deployed version of NotaryProxy next...

**Checking the Deployed Version of NotaryProxy**

For your ease of audit and security we've created a read-only AWS account which allows you to read the current version state of the NotaryProxy function.

1. First of all add this account to your AWS Credtentials (~/.aws/credentials):

```
[NotaryProxyCodeAuditor]
aws_access_key_id=AKIAISQD5XBAFXITXI7Q
aws_secret_access_key=UoPeIfiXJWzs/S14DQiesiNWtT465owKVpMHiEZ0
region=us-east-1
```
2. Now you can run the below command which will give you the date the service was last updated, but most importantly the **CodeSha256** which shows the full Sha256 hash of the current version for you to match against the hash you already have above.

```
aws lambda list-versions-by-function --function-name NotaryProxy --profile NotaryProxyCodeAuditor
```

Returns:

```
{
    "Versions": [
        {
            "FunctionName": "NotaryProxy",
            "FunctionArn": "arn:aws:lambda:us-east-1:813175761664:function:NotaryProxy:$LATEST",
            "Runtime": "nodejs8.10",
            "Role": "arn:aws:iam::813175761664:role/NotaryProxy-executor",
            "Handler": "index.handler",
            "CodeSize": 6377676,
            "Description": "",
            "Timeout": 3,
            "MemorySize": 128,
            "LastModified": "2018-06-13T15:25:49.612+0000",
            "CodeSha256": "e1ztPVSpKivoYiyy5rDfk7b/NCKJTHH8lxtnciwMPmk=",
            "Version": "$LATEST",
            "TracingConfig": {
                "Mode": "PassThrough"
            },
            "RevisionId": "f94d240d-b37e-4c54-90e9-6e6fcc92626e"
        }
    ]
}
```

This guarantees that the code currently running on AWS Lambda matches what is in the current release package!

Once you have confirmed that the Notary Proxy being used is valid and have audited the code to your requirements you can then proceed to the next stage - verifying a response.

**Verifying a data repsonse**

To verify a data response simply take the response you've received (Plain text version) and then regenerate the keccak256 hash yourself at:

https://emn178.github.io/online-tools/keccak_256.html

Once you have this, download the original process information to prove nothing has been changed and that the hashes all match up from:

https://s3.amazonaws.com/notaryproxy-audit/[request_key]

(Replacing [request_key] with your original request_key)

This completes the audit...  So now you've

1. Proven that the software is valid (Check https://github.com/dAppBridge/NotaryProxy)
2. Proven that the live NotaryProxy service is running a legitimate version of the software
3. Proven that the response you've received from any 3rd party using NotaryProxy (E.g. dAppBridge) is valid and has not been changed along the path.

For more information please get in touch: dapps@dappbridge.com

