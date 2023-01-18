import * as cdk from "aws-cdk-lib";
import { Duration, RemovalPolicy } from "aws-cdk-lib";
import {
  Distribution,
  OriginAccessIdentity,
  SecurityPolicyProtocol,
  ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";
import { Bucket, BucketAccessControl } from "aws-cdk-lib/aws-s3";
import {
  BucketDeployment,
  CacheControl,
  Source,
} from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";

const ERROR_RESPONSE_TTL = Duration.minutes(5);

export class AwsCdkIssue23708ReproductionRepoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new Bucket(this, "TestBucket", {
      bucketName: "some-test-bucket",
      removalPolicy: RemovalPolicy.DESTROY,
      accessControl: BucketAccessControl.PRIVATE,
    });

    const originAccessIdentity = new OriginAccessIdentity(
      this,
      "WebClientOriginAccessIdentity"
    );

    bucket.grantRead(originAccessIdentity);

    const distribution = new Distribution(this, "ClientAppDistribution", {
      defaultBehavior: {
        origin: new S3Origin(bucket, { originAccessIdentity }),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: "index.html",
      minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2018,
      errorResponses: [
        {
          ttl: ERROR_RESPONSE_TTL,
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
        },
        {
          ttl: ERROR_RESPONSE_TTL,
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
        },
      ],
    });
    new BucketDeployment(this, "DeployAssets", {
      sources: [
        Source.asset("assets", {
          exclude: ["*", "!index.html"],
        }),
      ],
      // index.html and env.config.js should never be cached because they can be updated without filename changes
      // and they are important to the functioning of the app. If they get stale, the app can break.
      cacheControl: [
        // no-cache - forces client to check to see if the resource has been updated via ETag or Last-Modified
        // no-store - tells user agents and intermediates not to cache anything at all in permanent storage
        // must-revalidate - don't use the cached version even if a new version can't be fetched
        CacheControl.fromString("no-cache, no-store, must-revalidate"),
      ],
      destinationBucket: bucket,
      prune: false,
      distribution,
      distributionPaths: ["/*"],
    });
  }
}
