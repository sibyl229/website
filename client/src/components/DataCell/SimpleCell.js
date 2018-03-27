import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';
import Link from '../Link';

class SimpleCell extends Component {
  renderByCases() {
    const {data} = this.props;
    if (data !== null && typeof data === 'object') {
      if (data.text && typeof data.text !== 'object') {
        return <span>{data.text}</span>;
      } else if (data.class) {
        return <Link {...data} />;
      } else {
        return (<span style={{wordBreak: 'break-all'}}>{JSON.stringify(data)}</span>);
      }
    } else if (typeof data === 'string' && data.search(/<.+\/?>/) > -1) {
      return <div dangerouslySetInnerHTML={{__html: data}} />;
    } else {
      return <span>{data}</span>;
    }
  }

  render() {
    const {classes} = this.props;
    return (
      <div className={classes.root}>
        {this.renderByCases()}
      </div>
    );
  };
}

SimpleCell.propTypes = {
  data: PropTypes.any,
  classes: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
};

const style = (theme) => {
  return {
    root: {
      margin: theme.spacing.unit / 2,
    }
  };
};

export default withStyles(style, {withTheme: true})(SimpleCell);
