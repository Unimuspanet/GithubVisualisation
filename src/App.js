//import logo from './logo.svg';
import './App.css';
//import { getAllByPlaceholderText } from '@testing-library/dom';
import { ResponsiveCalendar } from "@nivo/calendar";
import { ResponsivePie } from "@nivo/pie";
//import { render } from '@testing-library/react';
import React, {Component} from 'react';

const fixedTopStyle = {
  position: "fixed",
  top: "0",
  width: "100%",
  zIndex: "100",
  fontSize: "20px",
  backgroundColor: "#586476",
  margin: "10px",
  borderBottom: "6px solid #586476"
}

const infoBoxStyle = {
  position: "absolute",
  left: "0px",
  top: "50px",
  width: "200px",
  textAlign: "left",
  fontSize: "15px",
  backgroundColor: "#495363",
  border: "5px solid #495363",
  visibility: "hidden"
}

const chartStyle = {
  width: "500px",
  height: "650px",
  position: "absolute",
  left: "220px",
  top: "50px"
}

const pieStyle = {
  width: "600px",
  height: "600px",
  position: "absolute",
  left: "730px",
  top: "50px",
  visibility: "hidden"
}

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <div style={fixedTopStyle} className="Input-Row">
          Username of User to Search: 
          <input id="user" type="text" placeholder="Username"></input>
          Your Personal Auth Token: 
          <input id="token" type="text" placeholder="token"></input>
          <button onClick={inputReceived}>Go!</button>
        </div>
        <InfoBox />
        <Calendar />
        <Pie />
      </header>
    </div>
  );
}

async function inputReceived() {
  var user = document.getElementById("user").value;
  var token = document.getElementById("token").value;
  let generalData = await getGeneralData(user, token);
  setGeneralData(generalData);

  let repos = await getRepos(user, token);
  let reposCommits = await getCommits(user, repos, token);
  let calendarData = convertCommitsToCalendar(user, reposCommits)
  setCalendarData(calendarData);

  let pieData = await getPieData(user, repos, token);
  setPieData(pieData);
  console.log("all got");
}

async function tokenFetch(token, url)
{
  if (token === null) return await fetch(url);

  const header = {
    "Authorization": "token ".concat(token)
  }
  return await fetch(url, {
    "method": "GET",
    "headers": header
  });
}

async function getGeneralData(user, token) {
  let url = "https://api.github.com/users/".concat(user);
  console.log("getting...");
  console.log(url);
  let response = await tokenFetch(token, url);
  let data = await response.json();
  return data;
}

async function getRepos(user, token) {
  let url = "https://api.github.com/users/".concat(user, "/repos");
  let data = await (await tokenFetch(token, url)).json();
  return data;
}

async function getCommits(user, repos, token)
{
  let baseurl = "https://api.github.com/repos/".concat(user, "/");
  let commits = [];
  for (let i = 0; i < repos.length; i++)
  {
    let url = baseurl.concat(repos[i].name, "/commits");
    commits[i] = await (await tokenFetch(token, url)).json();
  }
  return commits;
}

async function getPieData(user, repos, token)
{
  let baseurl = "https://api.github.com/repos/".concat(user, "/");
  let languages = [];
  for (let i = 0; i < repos.length; i++)
  {
    let url = baseurl.concat(repos[i].name, "/languages");
    languages[i] = await (await tokenFetch(token, url)).json();
  }
  
  let result = {};
  for (let i = 0; i < languages.length; i++)
  {
    let curr = languages[i];
    for (const element in curr)
    {
      if (result[element] == null) result[element] = curr[element];
      else result[element] += curr[element];
    }
  }
  return result;
}

function convertCommitsToCalendar(user, reposCommits)
{
  let earliestDate = null;
  let latestDate = null;
  let data = []
  let lastDate = null;
  let value = 1;

  for (let i = 0; i < reposCommits.length; i++)
  {
    for (let j = 0; j < reposCommits[i].length; j++)
    {
      if (reposCommits[i][j].author === null || reposCommits[i][j].author.login === user)
      {
        if (lastDate === null)
        {
          lastDate = reposCommits[i][j].commit.committer.date.split("T")[0];
        } else {
          let currentDate = reposCommits[i][j].commit.committer.date.split("T")[0];
          if (currentDate === lastDate)
          {
            value++
          } else {
            data.push(
              {
                "value": value,
                "day": lastDate
              }
            );
            value = 1;
            lastDate = currentDate;
          }
        }

        if (earliestDate === null)
        {
          earliestDate = reposCommits[i][j].commit.committer.date;
          latestDate = reposCommits[i][j].commit.committer.date;
        } else {
          let currentDate = reposCommits[i][j].commit.committer.date;
          if (Date.parse(earliestDate) > Date.parse(currentDate))
          {
            earliestDate = currentDate;
          } 
          else if (Date.parse(latestDate) < Date.parse(currentDate))
          {
            latestDate = currentDate;
          }
        }
      }
    }
  }
  data.push(
    {
      "earliestDate": earliestDate,
      "latestDate": latestDate
    }
  )
  return data;
}

function setGeneralData(data) {
  let infoBox = window.infoComponent;
  infoBox.username = data.login;
  infoBox.dname = data.name;
  infoBox.company = data.company;
  infoBox.location = data.location;
  infoBox.email = data.email;
  infoBox.hireable = data.hireable;
  infoBox.bio = data.bio;
  infoBox.public_repos = data.public_repos;
  infoBox.followers = data.followers;
  infoBox.following = data.following;

  infoBox.show();
  infoBox.alertMessage();
}

function setCalendarData(data) {
  let calendar = window.calendarComponent;
  let dateRange = data.pop();
  calendar.data = data;
  calendar.startDate = dateRange.earliestDate;
  calendar.endDate = dateRange.latestDate;

  calendar.visible = true;
  calendar.alertMessage();
}

function selectColor(number) {
  const hue = (number * 137.508)%360; // use golden angle approximation
  return "hsl(".concat(Math.floor(hue+1), ", 50%, 75%)")
}

function setPieData(data) {
  let pie = window.pieComponent;

  let pieData = [];
  let i = 0;
  for (const d in data)
  {
    pieData[i] = {
      "id":d,
      "label":d,
      "value":data[d],
      "color":selectColor(i)
    };
    i++;
  }
  pie.data = pieData;
  console.log(pieData);

  pie.show();
  pie.alertMessage();
}

class InfoBox extends Component {
  username = "";
  dname = "";
  company = "";
  location = "";
  email = "";
  hireable = "";
  bio = "";
  public_repos = 0;
  followers = 0;
  following = 0;

  constructor() {
    super();
    window.infoComponent = this;
  }

  alertMessage() {
    this.forceUpdate();
  }

  show() {
    let thisinfobox = document.getElementById("infoBox");
    thisinfobox.style.visibility = "visible";
  }

  render() {
    return (
        <div style={infoBoxStyle} id="infoBox">
          <p><b>Username: {this.username}</b></p>
          {this.dname !== null && <p><b>Name: {this.dname}</b></p>}
          {this.company !== null && <p><b>Company: {this.company}</b></p>}
          {this.location !== null && <p><b>Location: {this.location}</b></p>}
          {this.email !== null && <p><b>Email: {this.email}</b></p>}
          {this.hireable != null && <p><b>Hireable: {this.hireable}</b></p>}
          {this.bio !== null && <p><b>Bio: {this.bio}</b></p>}
          <p><b>Public Repos: {this.public_repos}</b></p>
          <p><b>Followers: {this.followers}</b></p>
          <p><b>Following: {this.following}</b></p>
        </div>
    );
  }
}

class Calendar extends Component {
  visible = false;
  data = [];
  startDate = "2015-03-01";
  endDate = "2016-07-12";

  constructor() {
    super();
    window.calendarComponent = this;
  }

  alertMessage() {
    this.forceUpdate();
  }

  render() {
    return (
      <div style={chartStyle} id="calendar">
        { this.visible && <ResponsiveCalendar
            data={this.data}
            from={this.startDate}
            to={this.endDate}
            align="top-left"
            emptyColor="#eeeeee"
            colors={[ '#61cdbb', '#97e3d5', '#e8c1a0', '#f47560' ]}
            margin={{ top: 30, right: 0, bottom: 0, left: 20 }}
            yearSpacing={40}
            monthBorderColor="#ffffff"
            dayBorderWidth={2}
            dayBorderColor="#ffffff"
            theme={{
              "textColor":"#ffffff"
            }}
            legends={[
              {
                  anchor: 'bottom-right',
                  direction: 'row',
                  translateY: 36,
                  itemCount: 4,
                  itemWidth: 42,
                  itemHeight: 36,
                  itemsSpacing: 14,
                  itemDirection: 'right-to-left',
                  itemTextColor: "#ffffff",
              }
            ]}
          />
        }
      </div>
    )
  }
}

class Pie extends Component {
  data = [];

  constructor() {
    super();
    window.pieComponent = this;
  }

  alertMessage()
  {
    this.forceUpdate();
  }

  show() {
    let thispiebox = document.getElementById("pieBox");
    thispiebox.style.visibility = "visible";
  }

  render() {
    return (
      <div style={pieStyle} id="pieBox">
        <ResponsivePie
          data={this.data}
          margin = {{top:40, right:80, bottom: 80, left: 80}}
          arcLabel="value"
          arcLabelsSkipAngle={5}
          arcLabelsTextColor="#ffffff"
          arcLinkLabel="id"
          arcLinkLabelsSkipAngle={5}
          arcLinkLabelsDiagonalLength={10}
          arcLinkLabelsStraightLength={10}
          arcLinkLabelsThickness={2}
          arcLinkLabelsTextColor="#ffffff"
          innerRadius={0.4}
          cornerRadius={2}
          sortByValue={true}
          activeInnerRadiusOffset={5}
          activeOuterRadiusOffset={5}
          animate={false}
          theme={{
            "background":"#282c34",
            "textColor":"#808080"
          }}
          legends={[
            {
              anchor: "bottom",
              direction: "row",
              justify: false,
              translateY: 50,
              itemWidth: 100,
              itemHeight: 20,
              effects: [
                {
                    on: 'hover',
                    style: {
                        itemTextColor: '#000'
                    }
                }
              ]
            }
          ]}
        />
      </div>
    );
  }
}

export default App;