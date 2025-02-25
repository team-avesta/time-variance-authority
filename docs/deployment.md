# Deployment Documentation

## GitHub Actions Deployment

This project uses GitHub Actions to automatically deploy updates to AWS Lambda whenever changes are pushed to the main branch.

### Prerequisites

Before the GitHub Actions workflow can run successfully, you need to configure the following secrets in your GitHub repository:

1. AWS Credentials:
   - `AWS_ACCESS_KEY_ID`: Your AWS access key
   - `AWS_SECRET_ACCESS_KEY`: Your AWS secret key
   - `AWS_REGION`: The AWS region where your Lambda function is deployed (e.g., `us-east-1`)

### Workflow Steps

1. **Code Checkout**: The workflow checks out the latest code from the repository
2. **Setup**: Configures Node.js 16 and npm
3. **Testing**: Runs any configured tests
4. **Build**: Compiles TypeScript code to JavaScript
5. **Packaging**: Creates a zip file containing the compiled code and dependencies
6. **Deployment**: Updates the Lambda function with the new code
7. **Verification**: Checks that the function is active after deployment

### Monitoring Deployments

You can monitor deployments in several ways:

1. **GitHub Actions Dashboard**:

   - Go to your repository's "Actions" tab
   - Click on the latest workflow run
   - You'll see detailed logs for each step
   - Look for these key indicators:
     - Package size in the "Package Lambda" step
     - Function state in the "Verify Deployment" step
     - Last update time and code size

2. **Common Failure Points**:

   - Build failures: Check the "Build TypeScript" step logs
   - Packaging failures: Check the "Package Lambda" step logs
   - Deployment failures: Check the "Deploy to Lambda" and "Verify Deployment" steps
   - If rollback occurs: Check the "Rollback on Failure" step logs

3. **AWS Console**:
   - Log into AWS Console
   - Go to Lambda function
   - Check "Configuration" tab for:
     - Last modified date
     - Function state
     - Code size
   - Check "Monitor" tab for:
     - Recent invocations
     - Error rates
     - CloudWatch logs

### Rollback Process

The workflow includes automatic rollback in case of deployment failure:

1. Before deployment, the current function version is stored
2. If deployment fails, the function is automatically rolled back to the previous version
3. The rollback status is logged in the GitHub Actions output

### Manual Deployment

If you need to deploy manually:

1. Build the project:

   ```bash
   npm install
   npm run build
   ```

2. Create deployment package:

   ```bash
   cd dist
   zip -r ../lambda.zip .
   cd ..
   zip -r lambda.zip node_modules/
   ```

3. Deploy using AWS CLI:
   ```bash
   aws lambda update-function-code \
     --function-name time-variance-authority \
     --zip-file fileb://lambda.zip
   ```

### Troubleshooting

1. **Build Failures**:

   - Check the GitHub Actions logs for compilation errors
   - Ensure all dependencies are properly listed in `package.json`
   - Common issues:
     - TypeScript errors
     - Missing dependencies
     - Incorrect Node.js version

2. **Deployment Failures**:

   - Check AWS credentials are correctly configured
   - Verify Lambda function permissions
   - Common issues:
     - Package size too large
     - Invalid AWS credentials
     - Lambda function not found
     - Insufficient IAM permissions

3. **Runtime Errors**:
   - Check CloudWatch logs in AWS Console
   - Review function configuration
   - Common issues:
     - Memory limits
     - Timeout settings
     - Missing environment variables
