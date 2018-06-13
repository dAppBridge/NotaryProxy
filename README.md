# Notary Proxy - 3rd party validation & proof of online content

Notary Proxy is a simple Middleware that when used in an audit-able environment can verify and prove that content received has not been tampered with.  For each request made it validates and provides a secure proof of the content received, as it is received from the source endpoint.

Notary Proxy is used within the dAppBridge Ethereum Oracle to provide verifiable proofs that all data returned is valid and has not been tampered with along the chain of requests.

Other potential uses include validating automated API requests. E.g. When relying on a service that retrieves price data from a remote 3rd party API endpoint how can you be sure the data it provides has not been altered during transit?  By Using Notary Proxy as the trusted intermediary every piece of data returned comes with a validation proof.

## How it works

The Notary Proxy works as a middleware, sitting between you and the actual destination of your request.  By being hosted as a validated authority Notary Proxy is able to prove that the content you received is as served from the destination host.

The production code runs on as a AWS Lambda service... with the package available for you to audit.

We also provide a AWS Access account where you can verify the software has not been modified and that it matches the release version here on Github.

AWS Access Account:


Add this account to your AWS Credtentials (~/.aws/credentials):

```
[NotaryProxyCodeAuditor]
aws_access_key_id=AKIAISQD5XBAFXITXI7Q
aws_secret_access_key=UoPeIfiXJWzs/S14DQiesiNWtT465owKVpMHiEZ0
region=us-east-1
```


And then run the following aws command to get the source code hash of the currently deployed version:

```
aws lambda list-versions-by-function --function-name NotaryProxy --profile NotaryProxyCodeAuditor
```

## How to validate & verify, how can you trust Notary Proxy?

Notary Proxy currently runs as an AWS Lambda endpoint, using v1.0.0 of the NotaryProxy service.

To get the current source code Hash:

1. Download the latest release package from:
2. Use a 3rd party SHA256 gnerator to get the full package hash, we suggest something like:
https://hash.online-convert.com/sha256-generator
- This will let you uplaod the full archive
3. Compare the **base64** result of the hash against the result from the **CodeSha256** returned from:

```
aws lambda list-versions-by-function --function-name NotaryProxy --profile NotaryProxyCodeAuditor
```

This guarantees that the code currently running on AWS Lambda matches what is in the current release package!


Once you have confirmed that the Notary Proxy being used is valid and have audited the code to your requirements you can then proceed to the next stage - verifying a response.

