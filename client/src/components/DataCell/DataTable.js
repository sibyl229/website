import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Table, { tableDefaults } from '../Table';
import SmartCell from './SmartCell';

const cellSortValue = (value) => {
  if (value !== null && typeof value === 'object') {
    return value.label || value.text || value.id || JSON.stringify(value);
  } else {
    return value;
  }
}

class DataTable extends Component {
  render() {
    const {columns, ...restProps} = this.props;
    return (
      <div>
        <Table
          columns={columns.map((c) => ({
              ...c,
              Cell: props => (
                <SmartCell data={props.row[c.accessor]} printable={props.tdProps.rest.printable} />
              ), // Custom cell components!
              Header: props => (
                (typeof c.Header === 'string' && c.Header.search(/<.+\/?>/) > -1) ?
                <div dangerouslySetInnerHTML={{__html: c.Header}} /> :
                c.Header
              ),
          }))}
          defaultSortMethod={(a, b, desc) => (
            tableDefaults.defaultSortMethod(cellSortValue(a), cellSortValue(b), desc)
          )}
          {...restProps}
        />
      </div>
    );
  }
};

DataTable.propTypes = {
  data: PropTypes.array.isRequired,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      accessor: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default DataTable;
