(function () {
  // Prevent multiple injections
  if (document.getElementById('ai-support-widget-container')) return;

  // Find the currently executing script to read data attributes
  var scriptTag = document.currentScript;
  var apiKey = scriptTag ? scriptTag.getAttribute('data-api-key') : null;

  if (!apiKey) {
    console.error('AI Support Widget: Missing data-api-key attribute on script tag.');
    return;
  }

  // Create the main container
  var container = document.createElement('div');
  container.id = 'ai-support-widget-container';
  container.style.position = 'fixed';
  container.style.bottom = '20px';
  container.style.right = '20px';
  container.style.zIndex = '999999';
  container.style.fontFamily = 'sans-serif';

  // State
  var isOpen = false;

  // Create the toggle button
  var button = document.createElement('button');
  button.innerHTML = '💬';
  button.style.width = '60px';
  button.style.height = '60px';
  button.style.borderRadius = '50%';
  button.style.backgroundColor = '#0070f3';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.cursor = 'pointer';
  button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  button.style.fontSize = '24px';
  button.style.display = 'flex';
  button.style.alignItems = 'center';
  button.style.justifyContent = 'center';
  button.style.position = 'absolute';
  button.style.bottom = '0';
  button.style.right = '0';
  button.style.transition = 'transform 0.2s';

  // Create the iframe
  var iframe = document.createElement('iframe');
  // Derive the widget URL from where this script is hosted
  var widgetOrigin = new URL(scriptTag.src).origin;
  iframe.src = widgetOrigin + '/widget?apiKey=' + encodeURIComponent(apiKey);
  iframe.style.width = '350px';
  iframe.style.height = '500px';
  iframe.style.border = 'none';
  iframe.style.borderRadius = '12px';
  iframe.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
  iframe.style.position = 'absolute';
  iframe.style.bottom = '80px';
  iframe.style.right = '0';
  iframe.style.display = 'none'; // Hidden by default
  iframe.style.backgroundColor = 'white';

  // Toggle Logic
  button.onclick = function () {
    isOpen = !isOpen;
    if (isOpen) {
      iframe.style.display = 'block';
      button.innerHTML = '✕';
    } else {
      iframe.style.display = 'none';
      button.innerHTML = '💬';
    }
  };

  // Assemble
  container.appendChild(iframe);
  container.appendChild(button);
  document.body.appendChild(container);
})();
