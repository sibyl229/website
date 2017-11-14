import React, { Component } from 'react';
import { Surface, Group, Shape } from 'react-art';
import { forceSimulation, forceLink, forceManyBody, forceCenter } from 'd3-force';
import 'art/modes/svg';

class Circle extends Component {
  render() {
    const {r, ...otherProps} = this.props;
    return <Shape {...otherProps} d={`M ${-r} 0 a ${r} ${r} 0 1 1 ${2 * r} 0 a ${r} ${r} 0 1 1 ${-2 * r} 0`} />;
  }
}

export default class Graph extends Component {
  constructor(props) {
    super(props);
    this.state = {
      annotatedNodes: [],
      annotatedEdges: []
    };
  }
  componentDidMount = () => {
    this.simulation = forceSimulation()
      .force("link", forceLink().id(function(d) { return d.id; }))
      .force("charge", forceManyBody())
      .force("center", forceCenter(this.props.width / 2, this.props.height / 2))
      .on("tick", this.redraw);

    this.setupSimulationData();
  }

  setupSimulationData = () => {
    this.copiedNodes = this.props.nodes.map((d) => ({...d}));
    this.copiedEdges = this.props.edges.map((d) => ({...d}));
    this.simulation
        .nodes(this.copiedNodes)

    this.simulation.force("link")
        .links(this.copiedEdges);
  }

  redraw = () => {
    console.log(this.copiedNodes);
    this.setState({
      annotatedNodes: this.copiedNodes,
      annotatedEdges: this.copiedEdges
    })
  }

  copyNodes

  render() {
    console.log('AAAAA');
    return (
      <div>
        <h3>Placeholder for a graph</h3>
        <Surface
          width={700}
          height={700}
          style={{cursor: 'pointer'}}>
          <Circle x={100} y={100} r={30} fill="yellow" />
          {
            (this.state.annotatedNodes || []).map((d) => <Circle x={d.x} y={d.y} r={5} fill="black" />)
          }
          {
            (this.state.annotatedEdges || []).map((d) => (
              <Shape
                d={`M ${d.source.x} ${d.source.y} L ${d.target.x} ${d.target.y}`}
                stroke="black"
                strokeWidth={1}
              />
            ))
          }
        </Surface>
      </div>
    );
  }
}
