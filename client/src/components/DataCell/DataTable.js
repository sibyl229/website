import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Table, { tableDefaults } from '../Table';

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
              Cell: props => <span style={{color: 'red'}}>{JSON.stringify(props.row[c.accessor])}</span>, // Custom cell components!
              ...c
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
