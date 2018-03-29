import React, { Component } from 'react';
import PropTypes from 'prop-types';
import DownloadButton from './DownloadButton';

class SavePDF extends Component {
  generateContent = () => {
    return Promise.all([
      import('react-dom/server'),
      import('jspdf')
    ]).then(([ReactDOMServer, jsPDF]) => {
      const {renderToString} = ReactDOMServer;
      const htmlFragment = renderToString(this.props.node);
      //      const htmlFragment = '<div>hhhhh</div>';
      /* const htmlFragment = `
       * <div class="ReactTable -striped" data-reactroot="">
       *    <div class="rt-table">
       *       <div class="rt-thead -header" style="min-width:200px">
       *          <div class="rt-tr">
       *             <div class="rt-th  rt-resizable-header -sort-asc -cursor-pointer" role="heading" style="flex:100 0 auto;width:100px">
       *                <div class="rt-resizable-header-content">Anatomy term</div>
       *                <div class="rt-resizer"></div>
       *             </div>
       *             <div class="rt-th  rt-resizable-header -cursor-pointer" role="heading" style="flex:100 0 auto;width:100px">
       *                <div class="rt-resizable-header-content">Supporting evidence</div>
       *                <div class="rt-resizer"></div>
       *             </div>
       *          </div>
       *       </div>
       *       <div class="rt-tbody" style="min-width:200px">
       *          <div class="rt-tr-group">
       *             <div class="rt-tr -odd">
       *                <div class="rt-td" style="flex:100 0 auto;width:100px">
       *                   <div class="SimpleCell-root-18"><a href="/species/all/anatomy_term/WBbt:0003963"><span class="Link-linkLabel-19">AIYL</span></a></div>
       *                </div>
       *                <div class="rt-td" style="flex:100 0 auto;width:100px">
       *                   <ul class="ListCell-ul-20">
       *                      <li class="ListCell-li-21">
       *                         <div>
       *                            <div class="EvidenceCell-main-22">
       *                               <div>

       *                               </div>
       *                               <div class="SimpleCell-root-18"><a href="/species/all/expr_pattern/Expr8549"><span class="Link-linkLabel-19">Expr8549</span></a></div>
       *                            </div>
       *                            <div class="EvidenceCell-more-23"></div>
       *                         </div>
       *                      </li>
       *                   </ul>
       *                </div>
       *             </div>
       *          </div>

       *       </div>
       *    </div>
       *    <div class="pagination-bottom">
       *       <div class="-pagination">
       *          <div class="-previous"><button type="button" disabled="" class="-btn">Previous</button></div>
       *          <div class="-center">
       *             <span class="-pageInfo">
       *                Page<!-- -->
       *                <div class="-pageJump"><input type="number" value="1"/></div>
       *                <!-- -->of<!-- --> <span class="-totalPages">1</span>
       *             </span>
       *             <span class="select-wrap -pageSizeOptions">
       *                <select>
       *                   <option value="5">5 rows</option>
       *                   <option selected="" value="10">10 rows</option>
       *                   <option value="20">20 rows</option>
       *                   <option value="25">25 rows</option>
       *                   <option value="50">50 rows</option>
       *                   <option value="100">100 rows</option>
       *                </select>
       *             </span>
       *          </div>
       *          <div class="-next"><button type="button" disabled="" class="-btn">Next</button></div>
       *       </div>
       *    </div>
       *    <div class="-loading">
       *       <div class="-loading-inner">Loading...</div>
       *    </div>
       * </div>
       * `;
       */
      const styles = document ?
                     [...document.getElementsByTagName('link')].map(
                       (t) => t.outerHTML.replace(/"\//g, `"${window.location.origin}/`)
                     ).join('') + [...document.getElementsByTagName('style')].map(
                       (t) => t.outerHTML
                     ).join('') :
                     '';

      const html = `
        <html>
          <head>
            <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
                <meta name="theme-color" content="#000000" />
                  ${styles}
          </head>
                  <body>${htmlFragment}</body>
                    <html>
      `.replace(/\n/g, '').replace(/<svg.+?\/svg>/g, '');

      const doc = new jsPDF();
      // All units are in the set measurement for the document
      // This can be changed to "pt" (points), "mm" (Default), "cm", "in"
      //doc.fromHTML(htmlFragment, 15, 15, {width: 170});
      doc.fromHTML(html, 15, 15, {
        'width': 170,
      });
      console.log(html);
      return doc.save('x.pdf');
      //      return `${html}`;
    }).catch(() => {
      throw new Error();
    });
  }

  fileSaveFunc = (content) => {
    console.log('done');
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
      <DownloadButton
        contentFunc={this.generateContent}
        fileSaveFunc={this.fileSaveFunc}
        {...restProps}
      />
    );
  }
}

SavePDF.propTypes = {
  node: PropTypes.node,
};

export default SavePDF;