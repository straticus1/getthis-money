<?php
// GetThis.Money - AI Business Idea Generator
// Author: Ryan Coleman <coleman.ryan@gmail.com>
// License: MIT

// Set content type
header('Content-Type: text/html; charset=utf-8');

// Get current timestamp for cache busting
$timestamp = time();
?>
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta
      name="description"
      content="AI-powered business idea generator with revenue estimation - GetThis.Money"
    />
    <meta name="author" content="Ryan Coleman <coleman.ryan@gmail.com>" />
    <meta name="keywords" content="business ideas, AI, revenue estimation, entrepreneurship, startup" />
    <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
    <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <title>GetThis.Money - AI Business Idea Generator</title>
    
    <!-- PHP-generated meta tags for SEO -->
    <meta property="og:title" content="GetThis.Money - AI Business Idea Generator" />
    <meta property="og:description" content="Generate your next million-dollar business idea with AI-powered insights and revenue projections." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="<?php echo $_SERVER['REQUEST_URI']; ?>" />
    <meta property="og:image" content="%PUBLIC_URL%/og-image.png" />
    
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="GetThis.Money - AI Business Idea Generator" />
    <meta name="twitter:description" content="Generate your next million-dollar business idea with AI-powered insights and revenue projections." />
    <meta name="twitter:image" content="%PUBLIC_URL%/twitter-image.png" />
    
    <!-- Cache busting for CSS and JS -->
    <link rel="stylesheet" href="%PUBLIC_URL%/static/css/main.css?v=<?php echo $timestamp; ?>" />
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
    
    <!-- PHP-generated analytics and tracking -->
    <?php if (isset($_SERVER['HTTP_HOST']) && $_SERVER['HTTP_HOST'] !== 'localhost'): ?>
    <!-- Production analytics code can be added here -->
    <script>
      // Google Analytics or other tracking code
      console.log('GetThis.Money loaded successfully');
    </script>
    <?php endif; ?>
    
    <!-- React app will be mounted here -->
    <script src="%PUBLIC_URL%/static/js/main.js?v=<?php echo $timestamp; ?>"></script>
  </body>
</html>
