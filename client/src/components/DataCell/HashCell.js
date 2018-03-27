import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';
import { hasContent } from './utils';
//import SimpleCell from './SimpleCell';

const HashCell = (props) => {
  const {data, render, classes} = props;
  return (
    <div>
    {
      Object.keys(data).filter((key) => (
        hasContent(data[key])
      )).map((key) => (
        <div key={key} className={classes.pair}>
          <div className={classes.key}>{key.replace(/_+/g, ' ')}: </div>
          <div className={classes.value}>{render({elementValue: data[key]})}</div>
        </div>
      ))
    }
    </div>
  );
};

HashCell.propTypes = {
  data: PropTypes.object,
  render: PropTypes.func.isRequired,
  classes: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
};

const styles = (theme) => {
  return {
    pair: {
      display: 'flex',
      flexWrap: 'wrap',
      margin: theme.spacing.unit / 2,
      padding: 0,
    },
    key: {
      fontWeight: 700,
      flex: '0 1 auto',
    },
    value: {
    },
  }
};

export default withStyles(styles, { withTheme: true })(HashCell);
