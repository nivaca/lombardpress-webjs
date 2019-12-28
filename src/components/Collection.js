import React from 'react';
import Container from 'react-bootstrap/Container';

import FormControl from 'react-bootstrap/FormControl';
import Table from 'react-bootstrap/Table';

import {runQuery} from './utils'
import {basicStructureAllItemsInfoQuery, partsInfoQuery,workGroupExpressionQuery} from './Queries'

import Item from "./Item"
import Search3 from "./Search3"

//import Lbp from "lbp.js/lib"


class Collection extends React.Component {
  constructor(props){
    super(props)
    this.retrieveCollectionInfo = this.retrieveCollectionInfo.bind(this)
    this.makeRequests = this.makeRequests.bind(this)
    this.handleFilter = this.handleFilter.bind(this)
    this.filter = React.createRef();
    this.mount = false
    this.state = {
      items: {},
      parts: {},
      filter: ""
    }

  }
  handleFilter(e){
    const item = e.target.value
    this.setState({filter: item})

  }
  arrangeParts(partsPromise){
    const _this = this
    partsPromise.then((d) => {
        const bindings = d.data.results.bindings
        let partsObject = {}
        bindings.forEach((b) => {
          const pId = b.part.value
          partsObject[pId] = {
            id: b.part.value,
            title: b.partTitle.value,
            type: b.partType.value,
            questionTitle: b.partQuestionTitle ? b.partQuestionTitle.value : null,
            level: b.partLevel ? b.partLevel.value : "unknown",
        }
      });
      if (this.mount){
        _this.setState(
          {
            parts: partsObject
          }
        )
      }
    });
  }
  arrangeItems(itemsPromise){
    const _this = this
    itemsPromise.then((d) => {
      const bindings = d.data.results.bindings
      let itemsObject = {}
      bindings.forEach((b) => {
        const itemId = b.item.value
        itemsObject[itemId] = {
          title: b.itemTitle.value,
          id: b.item.value,
          type: b.itemType.value,
          questionTitle: b.itemQuestionTitle ? b.itemQuestionTitle.value : null,
          author: b.itemAuthor ? b.itemAuthor.value : null,
          authorTitle: b.itemAuthorTitle ? b.itemAuthorTitle.value : null,
          next: b.next ? b.next.value : null,
          previous: b.previous ? b.previous.value : null,
          cm: b.cm ? b.cm.value : null,
          cmTitle: b.cmTitle ? b.cmTitle.value : null,
          ct: b.ct ? b.ct.value : null,
          topLevel: b.topLevel ? b.topLevel.value : null,
          doc: b.doc ? b.doc.value : null
        }
      });
      if (this.mount){
        _this.setState(
          {
            items: itemsObject
          }
        )
      }
    })
    .catch((err) => {
      console.log(err)
    })
  }

  retrieveWorkGroupInfo(resourceid){
    const expressionsInfo = runQuery(workGroupExpressionQuery(resourceid))
    const partsInfo = runQuery(partsInfoQuery(resourceid))
    this.arrangeParts(partsInfo)
    this.arrangeItems(expressionsInfo)
  }
  retrieveCollectionInfo(resourceid, structureType, topLevel){
    const collectionInfo = runQuery(basicStructureAllItemsInfoQuery(topLevel))
    const partsInfo = runQuery(partsInfoQuery(resourceid))

    //add parts to state
    this.arrangeParts(partsInfo)
    /// add items to state
    this.arrangeItems(collectionInfo)
  }
  makeRequests(newResourceId, structureType, topLevel, type){

    //
    //   // get all expressions for this workGroup
      if (type === "http://scta.info/resource/workGroup"){
          this.retrieveWorkGroupInfo(newResourceId, structureType, topLevel)
          //this.setState({itemFocus: ""})
      }
      // get all items for this collection
      else if (structureType === "http://scta.info/resource/structureCollection"){
          this.retrieveCollectionInfo(newResourceId, structureType, topLevel)
          //this.setState({itemFocus: ""})
      }

  }
  componentDidUpdate(prevProps, prevState){

  }
  componentDidMount(){
    this.mount = true
    this.setState({resourceid: this.props.resourceid})
    this.makeRequests(this.props.resourceid, this.props.structureType, this.props.topLevel, this.props.type)

  }

  componentWillReceiveProps(nextProps) {

    // conditional prevents new information requestion if resource id has not changed
    if (nextProps.resourceid !== this.props.resourceid){
      this.setState({resourceid: nextProps.resourceid, filter: ""})
      // this conditional resets form value if ref is present
      if (this.filter){
        this.filter.current.value = ""
      }
      this.makeRequests(nextProps.resourceid, nextProps.structureType, nextProps.topLevel, nextProps.type)
    }
  }
  componentWillUnmount(){
    this.mount = false
  }
  render(){
    //const resourceid = Qs.parse(this.props.location.search, { ignoreQueryPrefix: true }).resourceid;

    const displayQuestions = () => {
      const questions = []
      Object.keys(this.state.items).forEach((key) => {
        const filterCheck = this.state.items[key].title + " " + this.state.items[key].authorTitle + " " + this.state.items[key].questionTitle
        if (filterCheck.toLowerCase().includes(this.state.filter.toLowerCase())){
        questions.push(
          <Item key={key} item={this.state.items[key]}/>
        )}
      });
      return (
        <Container>

        <h1>Available Texts</h1>
        <br/>
        <Table striped bordered hover size="sm">
        <tbody>
        {questions}
        </tbody>
        </Table>
        </Container>
      )
    }
    const displayParts = () => {
        const questions = []
        Object.keys(this.state.parts).forEach((key) => {
          //check against filter
            if (this.state.parts[key].title.toLowerCase().includes(this.state.filter.toLowerCase())){
            questions.push(
              <Item key={key} item={this.state.parts[key]}/>
              )
            }

        });
        //check against top level expression as parts; if parts are top level expression; don't display parts
        const testPart = this.state.parts[Object.keys(this.state.parts)[0]]
        if (testPart){
          if (!(testPart.type === "http://scta.info/resource/expression" && testPart.level === "1")){
            return (
              <Container>
              <h1>Available Text Collections</h1>
              <br/>
              <Table striped bordered hover size="sm">
              <tbody>
              {questions}
              </tbody>
              </Table>
              </Container>
            )
          }
        }
      }

    return (
      <Container className="collectionBody">
        <Search3 searchWorkGroup={this.props.resourceid}
        showSubmit={false}
        showAdvancedParameters={false}
        showLabels={false}/>
      <Container className="collectionFilter">
        <FormControl ref={this.filter} id="filter" placeholder="type to filter by title" onChange={this.handleFilter}/>
      </Container>
      {displayParts()}
      {displayQuestions()}
      </Container>
    );
  }
}

export default Collection;
