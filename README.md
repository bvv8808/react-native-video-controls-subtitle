# react-native-video-controls-subtitle

> `Note` This is the same with the 'react-native-controls' library. This is just what i have added the VideoPlayer.d.ts, the type define file on exsting that. also, it haves a different style for subtitle. I think the display style for subtitle is better than original library. Thank you.

## Features

**SUBTITLE SUPPORT ADDED**
In This package, you can pass a function as 'toggleFullscreen' prop to component to control the functionality of toggle fullscreen button.

You can find other features in [react-native-video-controls] (https://github.com/react-native-community/react-native-video-controls)
and [react-native-video](https://github.com/react-native-community/react-native-video) pages.

## Installation

Run `npm install --save react-native-video react-native-video-controls-subtitle`

Then run `react-native link react-native-video`

If you're using RN < 39 run `npm install --save react-native-video-controls@1.0.1`. Note this version includes `react-native-video` as a normal dependency instead of a peer-dependency.

##SUBTITLE
In order to use subtitles you should follow the below instructions :
First if your subtitle format is srt you should convert it to JSON(use websites like : http://multiverso.me/srtToJSON/)
Then when you got the array of JSONs, you can pass this array to VideoPlayer as below :

```javascript
<VideoPlayer subtitle={this.props.subtitle} />
```

##SUBTITLE STYLES
In order to use custom styles :

```javascript
<VideoPlayer
  subtitleContainerStyle={this.props.subtitleContainerStyle}
  subtitleStyle={this.props.subtitleStyle}
/>
```

The subtitle prop expects the JSON to have the following key-value format:

```javascript
[
  {
    startTime: "00:00:04,123", //hh:mm:ss,SSS
    endTime: "00:00:05,001",
    text: "When you convert your subtitle file, you might need to modify your JSON",
  },
  {
    startTime: "00:00:08,008",
    endTime: "00:00:09,876",
    text: "Before passing it to the VidePlayer component",
  },
];
```

## OTHER FEATURES AND USAGE

The `<VideoPlayer>` component can take a number of inputs to customize it as needed. They are outlined below:
The `<VideoPlayer>` component follows the API of the `<Video>` component at [react-native-video](https://github.com/react-native-community/react-native-video) and [react-native-video-controls](https://github.com/react-native-community/react-native-video-controls)

take a number of inputs to customize it as needed. They are outlined below:

```javascript
// At the top where our imports are...
import VideoPlayer from "react-native-video-controls-subtitles";

// in the component's render() function
<VideoPlayer
  source={{ uri: "https://vjs.zencdn.net/v/oceans.mp4" }}
  navigator={this.props.navigator}
  toggleFullscreen={YourCustomizedFunction}
  subtitle={this.props.subtitle}
/>;
```
