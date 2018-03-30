import React, { Component } from 'react';
import PropTypes from 'prop-types';
import DownloadButton from './DownloadButton';

class Print extends Component {

  generateContent = () => {
    const newWindow = window.open('', '_blank');
    newWindow.document.open();
    newWindow.document.write('Loading printable view...');
    newWindow.document.close();
    return Promise.all([
      import('react-dom/server'),
      import('jspdf')
    ]).then(([ReactDOMServer, jsPDF]) => {
      const {renderToString} = ReactDOMServer;
      const htmlFragment = renderToString(this.props.node);
      const styles = document ?
                     [...document.getElementsByTagName('link')].map(
                       (t) => t.outerHTML.replace(/"\//g, `"${window.location.origin}/`)
                     ).join('') + [...document.getElementsByTagName('style')].map(
                       (t) => t.outerHTML
                     ).join('') :
                     '';

      const html = `
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
              <meta name="theme-color" content="#000000">
              ${styles}
            </head>
          <body><div id="printable">Loading printable view...</div></body>
          <script>
            window.document.close();  // without this Firefox doesn't finish loading
            window.addEventListener("load", function(event) {
              window.document.getElementById('printable').innerHTML = '${htmlFragment}';
              console.log("All resources finished loading!");
              window.print();
            });
          </script>
          </html>
      `;
      newWindow.document.open();  // clears existing page content
      newWindow.document.write(html);
      newWindow.document.close;
      return html;
    }).catch(() => {
      throw new Error();
    });
  }

  render() {
    const {data, ...restProps} = this.props;
    return (
      <DownloadButton
        contentFunc={this.generateContent}
        fileSaveFunc={() => {}}
        {...restProps}
      />
    );
  }
}

Print.propTypes = {
  node: PropTypes.node,
};

export default Print;