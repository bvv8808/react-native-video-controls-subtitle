# react-native-video-controls-subtitle

> `Note` This is based on 'react-native-controls-subtitle' library. I added _VideoPlayer.d.ts_ file and fixed some bugs. You can check the changelog in my repository.

## Features

**HOW TO CONTROL FULLSCREEN AND USE THIS COMPONENT (Example)**

> `Note` It doesn't support the origin fullscreen mode on iOS because of the subtitle supporting.

```javascript
useEffect(() => {
  loadDetail({variables: {lang: store.getState().lang}});
  loadComment();
  Orientation.lockToPortrait();

  // Note: You can't use state in a BackHandler event listener. So i'm gonna use redux.
  const dismissAndroidFullscreen = () => {
    const isFullscreen = store.getState().fullscreen;
    if (!isFullscreen) return false;

    dismissFullscreen();
    return true;
  };
  BackHandler.addEventListener('hardwareBackPress', dismissAndroidFullscreen);

  return () => {
    BackHandler.removeEventListener(
      'hardwareBackPress',
      dismissAndroidFullscreen,
    );
  };
}, []);

const dismissFullscreen = () => {
    store.dispatch({
      type: 'SET',
      payload: {fullscreen: false},
    });
    Orientation.lockToPortrait();
    if (Platform.OS === 'android') refPlayer.current?.dismissFullscreenPlayer();
    refControl.current?.setFullscreen(false);
  };

const mySubtitle = [
  {startTime: '00:00:00,000', endTime: '00:00:03,000', text: 'hi'},
  {startTime: '00:00:05,000', endTime: '00:00:07,000', text: 'hello'}
]

...
<View
  style={{
    width: '100%',
    height: store.getState().fullscreen
      ? window.height
      : window.width * (9 / 16),
    position: 'absolute',
    top: store.getState().fullscreen ? 0 : headerHeight,
  }}>
  <VideoPlayer
    ref={(ref: any) => {
      if (ref) {
        refControl.current = ref;
        refPlayer.current = ref.player.ref;
      }
    }}
    onLoad={() => {
      refPlayer.current?.seek(0);
    }}
    toggleFullscreen={() => {
      if (store.getState().fullscreen) {
        dismissFullscreen();
      } else {
        if (Platform.OS === 'android')
          refPlayer.current?.presentFullscreenPlayer();
        store.dispatch({
          type: 'SET',
          payload: {fullscreen: true},
        });
        Orientation.lockToLandscape();
        refControl.current?.setFullscreen(true);
      }
    }}
    source={{uri: URL_YOU_WANT}}
    paused
    resizeMode="contain"
    subtitle={mySubtitles}
    useNativeDriver={false}
  />
</View>
```

## Installation

Run `npm install --save react-native-video @hyeonwoo/react-native-video-controls-subtitle`

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

## Methods

#### pause()

Pause the video

#### play()

Play the video

#### seekTo(seconds)

Seek to the time you want

#### getCurrentTime()

Get current playing seconds
