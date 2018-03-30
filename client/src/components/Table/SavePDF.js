import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Button from '../Button';
//import DownloadButton from './DownloadButton';

class SavePDF extends Component {

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
            //window.addEventListener("load", function(event) {
            window.document.getElementById('printable').innerHTML = '${htmlFragment}';
            //
//printJS('x', 'html')
          //});
            window.document.close();  // without this Firefox doesn't finish loading
            console.log("All resources finished loading!");
            window.print();
          </script>
          </html>
      `;
      //      newWindow.location = "about:blank";
      //      newWindow.document.body.innerHTML = '';
      newWindow.document.open();  // clears existing page content
      newWindow.document.write(html);
      newWindow.document.close;
      return html;
    }).catch(() => {
      throw new Error();
    });
  }

  fileSaveFunc = (content) => {
    if (window && window.document) {
      //const newWindow = window.open('', '_blank');
      // this.newWindow.document.write(content);
    }
    //    Promise.resolve(content).then((doc) => doc.save('x.pdf'))
  }
  /* fileSaveFunc = (content) => {
   *   console.log(content);
   *   import('file-saver').then((module) => {
   *     const {saveAs} = module;
   *     console.log(content);
   *     console.log(module);
   *     console.log(this);
   *     const blob = new Blob([content], {type: "text/plain;charset=utf-8"});
   *     saveAs(blob, this.props.fileName || 'download.txt');
   *   });
   * }*/


  render() {
    const {data, ...restProps} = this.props;
    return (
      <Button raised onClick={this.generateContent}>PDF</Button>
    );
  }
}

SavePDF.propTypes = {
  node: PropTypes.node,
};

export default SavePDF;