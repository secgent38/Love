# love-letter-website

A beautifully designed static love letter website for expressing deep affection and love.

## Live Demo

[love.qzydustin.com](http://love.qzydustin.com)

## Features

- Pure Native Development: Built with modern HTML5, CSS3, and ES6+ JavaScript
- Zero Dependencies: No jQuery or other third-party libraries required
- Highly Optimized: Deeply streamlined code for ultimate performance
- Responsive Design: Works seamlessly across all screen sizes
- Beautiful Animations: Romantic tree growing and heart falling animations
- Easy Customization: Simple to personalize content and memorial dates
- Well-Organized Code: Clear structure with excellent readability

## Tech Stack

- HTML5
- CSS3 (CSS Variables)
- JavaScript ES6+
- Canvas API

## Getting Started

1. Clone the repository:
```sh
git clone https://github.com/qzydustin/love-letter-website
```

2. Navigate to the project directory:
```sh
cd love-letter-website
```

3. Open `index.html` in your browser

## Customization

All text content is centralized in `config.js` for easy customization. Simply edit this file to personalize your love letter website.

### Edit config.js

```javascript
const CONFIG = {
  // Couple Information
  couple: {
    name1: 'Ms.Wang',        // First person's name
    name2: 'Mr.Qi',         // Second person's name
    connector: '和',         // Connector word (e.g., "and", "和")
    together: '在一起'       // "Together" text
  },
  
  // Memorial Date
  memorialDate: '2017-12-25T00:00:00',
  
  // Love Letter Content
  letter: {
    paragraph1: [...],  // First paragraph lines
    paragraph2: [...],  // Second paragraph lines
    paragraph3: [...]   // Third paragraph lines
  },
  
  // Time Display Text
  time: {
    prefix: '第 ',
    day: '天',
    hour: '小时',
    minute: '分钟',
    second: '秒'
  },
  
  // Seed Heart Text
  seedText: 'Miss You'
};
```

### Replace Background Music

Replace the `bgm.mp3` file with your favorite music.

## Project Structure

```
love-letter-website/
├── index.html      # Main page
├── styles.css      # Stylesheet
├── config.js       # Text content configuration
├── main.js         # Core logic
├── bgm.mp3         # Background music
├── favicon.svg     # Website icon
└── README.md       # Project documentation
```

## Browser Compatibility

- Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Full mobile browser support
- ES6+ features (arrow functions, destructuring, classes, async/await)
- CSS Variables support

## Contributing

Issues and Pull Requests are welcome!

## Acknowledgments

Thanks to the original creator of the initial version of this project. This version has been extensively modernized and optimized.

## License

MIT License
