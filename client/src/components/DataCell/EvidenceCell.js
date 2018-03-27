import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';
import { ExpandMore, ExpandLess } from '../icons';
import Collapse from '../Collapse';

class EvidenceCell extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
    };
  }

  handleToggle = () => {
    this.setState((prevState) => ({
      open: !prevState.open,
    }));
  }

  render() {
    const {renderContent, renderEvidence, data, classes} = this.props;
    //return "EvidenceCell: " + JSON.stringify(data);
    return (
      <div>
        <div className={classes.main} onClick={this.handleToggle}>
          {
            renderContent({
              contentData: data.text,
              data: data
            })
          }
          <div>
            {this.state.open ? <ExpandLess /> : <ExpandMore />}
          </div>
        </div>
        <Collapse in={this.state.open} timeout="auto" unmountOnExit>
          {
            renderEvidence({
              evidenceData: data.evidence,
              data: data
            })
          }
        </Collapse>
      </div>
    );
  }
}

EvidenceCell.propTypes = {
  data: PropTypes.shape({
    text: PropTypes.any,
    evidence: PropTypes.object
  }),
  renderContent: PropTypes.func,
  renderEvidence: PropTypes.func,
  classes: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
};

const style = (theme) => ({
  main: {
    display: 'flex',
    justifyContent: 'space-between',
  },
});

export default withStyles(style, {withTheme: true})(EvidenceCell);
