# GitHub Pages Deployment Guide

This guide will help you set up automatic deployment of your Taigi Dictionary App to GitHub Pages.

## 🚀 Automatic Deployment (Recommended)

### Prerequisites
- Your code is pushed to a GitHub repository
- Repository is public (or you have GitHub Pro for private repos)

### Setup Steps

1. **Enable GitHub Pages**
   - Go to your repository on GitHub
   - Click **Settings** tab
   - Scroll down to **Pages** section
   - Under **Source**, select **Deploy from a branch**
   - Choose **gh-pages** branch
   - Click **Save**

2. **Enable GitHub Actions**
   - Go to **Actions** tab in your repository
   - Click **Enable Actions** if not already enabled
   - The workflow will automatically run on pushes to main/master branch

3. **First Deployment**
   - Push your code to the main/master branch
   - Go to **Actions** tab to monitor the deployment
   - Once complete, your app will be available at: `https://yourusername.github.io/taigi-dict-app/`

## 🔧 Manual Deployment

If you prefer manual deployment:

```bash
# Build the app
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## 📝 Configuration Files

### Vite Config (`vite.config.js`)
```javascript
export default defineConfig({
  base: '/taigi-dict-app/', // Repository name
  // ... other config
})
```

### GitHub Actions (`.github/workflows/deploy.yml`)
- Automatically builds and deploys on push to main/master
- Uses Node.js 18
- Caches npm dependencies for faster builds

## 🌐 Custom Domain (Optional)

To use a custom domain:

1. **Add CNAME file**
   - Create `public/CNAME` file with your domain
   - Example: `mydomain.com`

2. **Update GitHub Actions**
   - Uncomment the `cname` line in `.github/workflows/deploy.yml`
   - Add your domain: `cname: mydomain.com`

3. **Configure DNS**
   - Add CNAME record pointing to `yourusername.github.io`

## 🔍 Troubleshooting

### Build Fails
- Check **Actions** tab for error details
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### App Not Loading
- Check if base path in `vite.config.js` matches repository name
- Verify GitHub Pages is enabled and pointing to gh-pages branch
- Check browser console for 404 errors

### Environment Variables
- Add Supabase environment variables in repository settings:
  - Go to **Settings** → **Secrets and variables** → **Actions**
  - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

## 📊 Deployment Status

- **Green checkmark** = Deployment successful
- **Red X** = Deployment failed (check Actions tab for details)
- **Yellow dot** = Deployment in progress

## 🔄 Continuous Deployment

Once set up, every push to main/master branch will:
1. Trigger GitHub Actions workflow
2. Build the app with latest changes
3. Deploy to GitHub Pages
4. Update your live site automatically

Your app will be available at: `https://yourusername.github.io/taigi-dict-app/` 