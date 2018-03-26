import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Table from '../Table';

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
