# AWS-CDK Issue 23708 Repo

See: https://github.com/aws/aws-cdk/issues/23708

# Instructions

1. Check out this repo
2. npm install
3. npm run cdk bootstrap # if required
4. npm run cdk deploy
5. Wait a long time for the distribution to be created...
6. Open lib/aws-cdk-issue-23708-reproduction-repo-stack.ts
7. To cause the issue you need to do two things at the same time (I know it is strange)
   a. Rename the BucketDeployment from "DeployAssets" to something else (e.g. "DeployAssets2")
   b. Remove `distribution` and `distributionPaths` from the BucketDeployment parameters
8. npm run cdk deploy
9. Expect an error like this:

```
2:26:48 pm | UPDATE_COMPLETE_CLEA | AWS::CloudFormation::Stack                      | AwsCdkIssue23708ReproductionRepoStack
2:26:50 pm | DELETE_FAILED        | AWS::CloudFormation::CustomResource             | DeployAssetsCustomResource49681559
Received response status [FAILED] from custom resource. Message returned: An error occurred (AccessDenied) when calling the CreateInvalidation operation: User: arn:aws:sts::74660726
8210:assumed-role/AwsCdkIssue23708Reproduct-CustomCDKBucketDeploymen-111FS5SFYGXIR/AwsCdkIssue23708Reproduct-CustomCDKBucketDeploymen-OPbuPWWk2HzT is not authorized to perform: clou
dfront:CreateInvalidation on resource: arn:aws:cloudfront::746607268210:distribution/E2ZON5HYQ9OXVC because no identity-based policy allows the cloudfront:CreateInvalidation action
(RequestId: a991938b-46d4-4250-8475-3af305cac523)
```

# Patch to cause issue

```patch
---
 lib/aws-cdk-issue-23708-reproduction-repo-stack.ts | 4 +---
 1 file changed, 1 insertion(+), 3 deletions(-)

diff --git a/lib/aws-cdk-issue-23708-reproduction-repo-stack.ts b/lib/aws-cdk-issue-23708-reproduction-repo-stack.ts
index 614d153..16771ac 100644
--- a/lib/aws-cdk-issue-23708-reproduction-repo-stack.ts
+++ b/lib/aws-cdk-issue-23708-reproduction-repo-stack.ts
@@ -56,7 +56,7 @@ export class AwsCdkIssue23708ReproductionRepoStack extends cdk.Stack {
         },
       ],
     });
-    new BucketDeployment(this, "DeployAssets", {
+    new BucketDeployment(this, "DeployAssetsRenamed", {
       sources: [
         Source.asset("assets", {
           exclude: ["*", "!index.html"],
@@ -72,8 +72,6 @@ export class AwsCdkIssue23708ReproductionRepoStack extends cdk.Stack {
       ],
       destinationBucket: bucket,
       prune: false,
-      distribution,
-      distributionPaths: ["/*"],
     });
   }
 }
--
```
