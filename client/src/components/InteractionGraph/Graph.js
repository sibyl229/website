import React, { Component } from 'react';
import { Surface, Shape, Group, Text, Transform } from 'react-art';
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
    this.setState({
      annotatedNodes: this.copiedNodes,
      annotatedEdges: this.copiedEdges
    })
  }


  render() {
    return (
      <div>
        <h3>Placeholder for a graph</h3>
        <Surface
          width={700}
          height={700}
          style={{cursor: 'pointer'}}>
          <Group transform={(new Transform().translate(350, 350).scale(2).translate(-350, -350))}>
            {
              (this.state.annotatedEdges || []).map((d) => (
                <Shape
                  key={d.id}
                  d={`M ${d.source.x} ${d.source.y} L ${d.target.x} ${d.target.y}`}
                  stroke={d.color}
                  strokeWidth={1}
                />
              ))
            }
            {
              (this.state.annotatedNodes || []).map((d) => (
                <Group key={d.id} transform={(new Transform().translate(d.x, d.y))}>
                  <Circle r={5} fill={d.color} />
                  <Group transform={(new Transform().scale(0.5))}>
                    <Text alignment="middle" fill={"black"} strokeWidth="3" stroke="white">{d.label}</Text>
                    <Text alignment="middle" fill={"black"}>{d.label}</Text>
                </Group>
                </Group>
              ))
            }
          </Group>
        </Surface>
      </div>
    );
  }
}
