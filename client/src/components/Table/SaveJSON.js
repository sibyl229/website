import React, { Component } from 'react';
import PropTypes from 'prop-types';
import DownloadButton from './DownloadButton';

class SaveJSON extends Component {
  generateContent = () => {
    return JSON.stringify(this.props.data, null, 2);
  }

  render() {
    const {data, ...restProps} = this.props;
    return (
      <DownloadButton
        contentFunc={this.generateContent}
        {...restProps}
      />
    );
  }
}

SaveJSON.propTypes = {
  data: PropTypes.any,
};

export default SaveJSON;