import React from 'react';
import PropTypes from 'prop-types';
import EvidenceCell from './EvidenceCell';
import SimpleCell from './SimpleCell';
import ListCell from './ListCell';
import HashCell from './HashCell';

function SmartCell(props) {
  const data = props.data;
  if (data !== null && typeof data === 'object') {
    if (Array.isArray(data)) {
      return (
        <ListCell
          render={
            ({elementData}) => <SmartCell {...props} data={elementData} />
          }
          {...props}
        />
      );
    } else {
      if (data.evidence && data.text) {
        return (
          <EvidenceCell
            renderContent={
              ({contentData}) => <SmartCell {...props} data={contentData} />
            }
            renderEvidence={
              ({evidenceData}) => <SmartCell {...props} data={evidenceData} />
            }
            {...props}
          />
        );
      } else if (data.evidence) {
        return (
          <SmartCell {...props} data={data.evidence} />
        );
      } else if (data.class || data.text) {
        return <SimpleCell {...props} />;
      } else {
        return (
          <HashCell
            render={
              ({elementValue}) =>  <SmartCell {...props} data={elementValue} />
            }
            {...props}
          />
        );
      }
    }
  } else {
    return <SimpleCell {...props} />;
  }
};

SmartCell.propTypes = {
  data: PropTypes.any,
};

export default SmartCell;
