import React, { Component } from 'react';
import { Surface, Group, Shape } from 'react-art';
import 'art/modes/svg';


class Circle extends Component {
  render() {
    const {r, ...otherProps} = this.props;
    return <Shape {...otherProps} d={`M ${-r} 0 a ${r} ${r} 0 1 1 ${2 * r} 0 a ${r} ${r} 0 1 1 ${-2 * r} 0`} />;
  }
}
export default class Graph extends Component {
  render() {
    return (
      <div>
        <h3>Placeholder for a graph</h3>
        <Surface
          width={700}
          height={700}
          style={{cursor: 'pointer'}}>
          <Group >
            <Circle x={100} y={100} r={30} fill="yellow" />
          </Group>
        </Surface>
      </div>
    );
  }
}
