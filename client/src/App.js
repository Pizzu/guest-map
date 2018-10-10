import React, { Component } from 'react';
import L from 'leaflet';
import Joi from 'joi';
import { Map, TileLayer, Marker, Popup } from 'react-leaflet';
import {Card, CardTitle, CardText, Button, Form, FormGroup, Label, Input} from 'reactstrap';
import userLocationUrl from './user_location.svg';
import guestLocationUrl from './others_location.svg';
import './App.css';

const myIcon = L.icon({
    iconUrl: userLocationUrl,
    iconSize: [50, 82],
    iconAnchor: [25, 82],
    popupAnchor: [0, -20],
});

const guestIcon = L.icon({
    iconUrl: guestLocationUrl,
    iconSize: [50, 82],
    iconAnchor: [25, 82],
    popupAnchor: [0, -82],
});

const schema = Joi.object().keys({
    name: Joi.string().min(1).max(100).required(),
    message: Joi.string().min(1).max(500).required()
});

const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000/api/v1/messages' : 'https://express-api-starter-otmitevhub.now.sh/api/v1/messages'

class App extends Component {

  constructor() {
    super();
    this.state = {
      messages: [],
      location: {
        lat: 0,
        lng: 0
      },
      haveUsersLocation: false,
      zoom: 2.5,
      userMessage: {
        name: '',
        message: ''
      },
      sendingMessage: false,
      sentMessage: false
    }
  }

  componentDidMount() {
    this.getAllUserMesseges();
    navigator.geolocation.getCurrentPosition((position) => {
      this.setState({
        location:{
          lat: position.coords.latitude,
          lng: position.coords.longitude
        },
        haveUsersLocation: true,
        zoom: 13
      })
    },() => {
      console.log("Uh oh... they didn't give us their location...");
      this.getUserLocation();
    });
  }

  async getAllUserMesseges() {
    let response = await fetch(API_URL);
    let messages = await response.json();
    const haveSeenLocation = {};
    messages = messages.reduce((all, message) => {
      const key = `${message.latitude} + ${message.longitude}`;
      if(haveSeenLocation[key]) {
        haveSeenLocation[key].otherMessages = haveSeenLocation[key].otherMessages || [];
        haveSeenLocation[key].otherMessages.push(message);
      } else {
        haveSeenLocation[key] = message;
        all.push(message)
      }
      return all
    }, [])
    this.setState({
      messages
    });
  }

  async getUserLocation() {
    let locationJSON = await fetch('https://ipapi.co/json/');
    let locationObj = await locationJSON.json();
    this.setState({
        location:{
          lat: locationObj.latitude,
          lng: locationObj.longitude
        },
        haveUsersLocation: true,
        zoom: 13
      })
    console.log(locationObj);
  }

  valueChanged = (event) => {
    this.setState({
      userMessage: {
        ...this.state.userMessage,
        [event.target.name]: event.target.value
      }
    });
  }

  formIsValid = () => {
    const userMessage = {
      name: this.state.userMessage.name,
      message: this.state.userMessage.message,
    };
    const result = Joi.validate(userMessage, schema);
    return !result.error && this.state.haveUsersLocation ? true : false;
  }

  formSubmitted = (event) => {
    event.preventDefault();
    if(this.formIsValid()) {
      this.setState({
        sendingMessage: true
      });
      fetch(API_URL, {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({
          name: this.state.userMessage.name,
          message: this.state.userMessage.message,
          latitude: this.state.location.lat,
          longitude: this.state.location.lng
        })
      }).then(res => res.json())
      .then(returnedMessage => {
        console.log(returnedMessage);
        setTimeout(() => {
          this.setState({
            messages: [...this.state.messages, returnedMessage],
            userMessage: {
              name: '',
              message: ''
            },
            sendingMessage: false,
            sentMessage: true
          });
        },2000); 
      })
    }
  }

  render() {
    const position = [this.state.location.lat, this.state.location.lng];
    return (
      <div className= "map-container">
        <Map className="map" center={position} zoom={this.state.zoom}>
          <TileLayer
            attribution="&amp;copy <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {this.state.haveUsersLocation ?
            <Marker
            position={position}
            icon={myIcon}>
            </Marker> : ''
          }
          {this.state.messages.map((message) => {
            return(
            <Marker
              key={message._id}
              position={[message.latitude, message.longitude]}
              icon={guestIcon}>
              <Popup>
                <p><em>{message.name}:</em> {message.message}</p>
                {message.otherMessages ? message.otherMessages.map(message => <p key={message._id}><em>{message.name}:</em> {message.message}</p>) : ''}
              </Popup>
            </Marker>
            )
          })}
        </Map>
         <Card body className="message-form">
            <CardTitle>Welcome to GuestMap!</CardTitle>
            <CardText>Leave a message with your location!</CardText>
            <CardText>Thanks for stopping by!</CardText>
            {
              !this.state.sendingMessage && !this.state.sentMessage && this.state.haveUsersLocation?
                <Form onSubmit={this.formSubmitted}>
                  <FormGroup>
                    <Label for="name">Name</Label>
                    <Input onChange={this.valueChanged} type="text" name="name" id="name" placeholder="Enter your name" />
                  </FormGroup>
                  <FormGroup>
                    <Label for="message">Message</Label>
                    <Input onChange={this.valueChanged} type="textarea" name="message" id="message" placeholder="Enter a message" />
                  </FormGroup>
                  <Button color="info" disabled={!this.formIsValid()}>Send</Button>
                </Form> : 
                this.state.sendingMessage || !this.state.haveUsersLocation ? 
                  <video autoPlay loop src="https://i.giphy.com/media/BCIRKxED2Y2JO/giphy.mp4"></video> :
                  <CardText>Thanks for submitting a message</CardText>
            }
        </Card>
      </div>
    );
  }
}

export default App;
