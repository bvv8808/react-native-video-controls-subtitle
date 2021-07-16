import React, { Component } from "react";
import {
  TouchableWithoutFeedback,
  TouchableHighlight,
  ImageBackground,
  PanResponder,
  StyleSheet,
  Touchable,
  Animated,
  Platform,
  Easing,
  Image,
  View,
  Text,
} from "react-native";
import Video from "react-native-video";

export default class VideoPlayer extends Component {
  constructor(props) {
    super(props);

    this.state = {
      // Video
      resizeMode: this.props.resizeMode || "contain",
      paused: this.props.paused || false,
      muted: this.props.muted || false,
      rate: this.props.rate || 1,

      // Controls
      showControls: true,
      showTimeRemaining: true,
      currentTime: 0,
      totalDuration: 0,
      seeking: false,
      loading: true,
      isFullscreen: false,
      timeRate: 0,
      deltaXSeeking: 0,

      // Custom State
      stop1s: false,
      seekerPositionPercent: 0,

      //Subtitle
      subtitles: [],
      subtitleIndex: 0,
      currentTimeInDeciSeconds: 0,
    };

    this.player = {
      controlTimeoutDelay: this.props.controlTimeout || 15000,
      seekPanResponder: PanResponder,
      controlTimeout: null,
      iconOffset: 7,
      seekWidth: 0,
      ref: Video,
    };

    /**
     * Various animations
     */
    this.animations = {
      bottomControl: {
        marginBottom: new Animated.Value(0),
        opacity: new Animated.Value(1),
      },
      topControl: {
        marginTop: new Animated.Value(0),
        opacity: new Animated.Value(1),
      },
      video: {
        opacity: new Animated.Value(1),
      },
      loader: {
        rotate: new Animated.Value(0),
        MAX_VALUE: 360,
      },
    };

    this.opts = {
      playWhenInactive: this.props.playWhenInactive || false,
      playInBackground: this.props.playInBackground || false,
      repeat: this.props.repeat || false,
      title: this.props.title || "",
    };

    /**
     * Our app listeners and associated methods
     */
    this.events = {
      onError: this.props.onError || this._onError.bind(this),
      onEnd: this.props.onEnd || this._onEnd.bind(this),
      onScreenTouch: this._onScreenTouch.bind(this),
      onLoadStart: this._onLoadStart.bind(this),
      onProgress: this._onProgress.bind(this),
      onLoad: this._onLoad.bind(this),
    };

    /**
     * Functions used throughout the application
     */
    this.methods = {
      // onBack: this.props.onBack || this._onBack.bind(this),
      toggleFullscreen: this._toggleFullscreen.bind(this),
      togglePlayPause: this._togglePlayPause.bind(this),
      toggleControls: this._toggleControls.bind(this),
      toggleTimer: this._toggleTimer.bind(this),
    };

    this.styles = {
      videoStyle: this.props.videoStyle || {},
      containerStyle: this.props.style || {},
      subtitleContainerStyle: this.props.subtitleContainerStyle || {},
      subtitleStyle: this.props.subtitleStyle || {},
    };

    this.initSeekPanResponder();
  }
  // <-- constructor

  parseTimeStringToDeciSecond(str) {
    let splitByComma = str.split(",");
    let result = 0.0;
    result = Math.round(parseInt(splitByComma[1]) / 100.0) / 10.0;
    let splitByColon = splitByComma[0].split(":");
    for (let i = 0; i < 3; i++) {
      result += splitByColon[i] * Math.pow(60, 2 - i);
    }
    return (Math.floor(result * 10) / 10.0).toFixed(1);
  }

  componentDidMount() {
    if (this.props.subtitle) {
      console.log("prop subtitle ::: ", this.props.subtitle.length);
      this.setState({
        subtitles: this.props.subtitle.map((s) => ({
          startTime: this.parseTimeStringToDeciSecond(s.startTime),
          endTime: this.parseTimeStringToDeciSecond(s.endTime),
          text: s.text,
        })),
      });
    }
  }
  componentDidUpdate(newProps, newState) {
    if (newProps.subtitle.length === newState.subtitles.length) return;

    this.setState({
      subtitles: this.props.subtitle.map((s) => ({
        startTime: this.parseTimeStringToDeciSecond(s.startTime),
        endTime: this.parseTimeStringToDeciSecond(s.endTime),
        text: s.text,
      })),
    });
  }

  // # Methods
  _onScreenTouch() {
    !this.state.stop1s && this.methods.toggleControls();
  }

  _onLoadStart() {
    let state = this.state;
    state.loading = true;
    this.loadAnimation();
    this.setState(state);

    if (typeof this.props.onLoadStart === "function") {
      this.props.onLoadStart(...arguments);
    }
  }

  /**
   * Set the error state to true which then
   * changes our renderError function
   *
   * @param {object} err  Err obj returned from <Video> component
   */
  _onError(err) {
    let state = this.state;
    state.error = true;
    state.loading = false;

    this.setState(state);
  }
  _onEnd() {}

  /**
   * For onprogress we fire listeners that
   * update our seekbar and timer.
   *
   * @param {object} data The video meta data
   */
  _onProgress(data = {}) {
    let state = this.state;
    state.currentTime = data.currentTime;

    // if (!state.seeking) {
    //   const position = this.calculateSeekerPosition();
    //   this.setSeekerPosition(position);
    // }

    if (typeof this.props.onProgress === "function") {
      this.props.onProgress(...arguments);
    }
    const currentTimeDec = Math.floor(data.currentTime * 10) / 10.0;
    state.currentTimeInDeciSeconds = currentTimeDec;
    // console.log(
    //   '@###########',
    //   currentTimeDec,
    //   state.totalDuration,
    //   (currentTimeDec / state.totalDuration) * 100,
    // );

    state.timeRate = currentTimeDec / state.totalDuration;
    state.deltaXSeeking = 0;

    this.setState(
      state
      // , () => {console.log('_onProgress')}
    );
  }

  /**
   * When load is finished we hide the load icon
   * and hide the controls. We also set the
   * video duration.
   *
   * @param {object} data The video meta data
   */
  _onLoad(data = {}) {
    let state = this.state;

    state.totalDuration = data.duration;
    state.loading = false;
    this.setState(state);

    if (state.showControls) {
      this.setControlTimeout();
    }

    if (typeof this.props.onLoad === "function") {
      this.props.onLoad(...arguments);
    }
  }

  _togglePlayPause() {
    let state = this.state;
    if (state.stop1s) return;
    state.paused = !state.paused;
    this.setState(state);
  }

  _toggleControls() {
    let state = this.state;
    state.showControls = !state.showControls;

    this.setState(state, () => {
      if (state.showControls) {
        this.showControlAnimation();
        this.setControlTimeout();
      } else {
        this.hideControlAnimation();
        this.clearControlTimeout();
      }
    });
  }

  _toggleFullscreen() {
    let state = this.state;
    const changedFullscreenMode = !state.isFullscreen;
    console.log(changedFullscreenMode);

    if (this.props.toggleFullscreen) {
      this.props.toggleFullscreen(changedFullscreenMode);
    }

    // state.resizeMode = state.isFullscreen === true ? 'cover' : 'contain';
    this.setState({
      isFullscreen: changedFullscreenMode,
      showControls: false,
      stop1s: true,
    });
    setTimeout(() => {
      this.setState({ stop1s: false });
    }, 500);

    if (
      Platform.OS === "android"
      // || (Platform.OS === 'ios' && !this.props.subtitle)
    ) {
      if (changedFullscreenMode === true) {
        this.player.ref.presentFullscreenPlayer();
      } else this.player.ref.dismissFullscreenPlayer();
    }
  }

  _toggleTimer() {
    let state = this.state;
    state.showTimeRemaining = !state.showTimeRemaining;
    this.setState(state, () => {
      console.log("_toggleTimer");
    });
  }

  _hideControls() {
    let state = this.state;
    state.showControls = false;
    this.hideControlAnimation();

    this.setState(state);
  }

  /**
   * Get our seekbar responder going
   */
  initSeekPanResponder() {
    this.player.seekPanResponder = PanResponder.create({
      // Ask to be the responder.
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => true,

      onPanResponderGrant: (evt, gestureState) => {
        console.log("Grant");
        this.clearControlTimeout();
        this.setState({ seeking: true, paused: true });
      },
      onPanResponderMove: (evt, gestureState) => {
        // console.log(gestureState.dx);
        const dRate = gestureState.dx / this.player.seekerWidth;

        if (this.state.timeRate + dRate <= 0) return;

        this.setState({ deltaXSeeking: gestureState.dx });
      },
      onPanResponderRelease: (evt, gestureState) => {
        console.log("Release");
        const { timeRate, deltaXSeeking } = this.state;
        const dRate = deltaXSeeking / this.player.seekerWidth;
        const newTimeRate = timeRate + dRate;

        setTimeout(() => {
          this.setState({ seeking: false });
        }, 1000);
        this.seekTo(this.state.totalDuration * newTimeRate);
        this.setControlTimeout();
        // 새로운 timeRate 반영과 deltaXSeeking 초기화는 seekTo실행 직후 실행 되는 onProgress에서 처리
      },
    });
  }

  pause() {
    this.setState({ paused: true });
  }
  play() {
    this.setState({ paused: false });
  }
  seekTo(time = 0) {
    console.log("seekTime :::   ", time);
    let state = this.state;

    if (this.props.subtitle) {
      const subtitleStartTimes = this.state.subtitles.map((s) => s.startTime);
      const newSubtitleIdx = subtitleStartTimes.findIndex((t) => t > time);
      state.subtitleIndex = newSubtitleIdx > 0 ? newSubtitleIdx - 1 : 0;
    }

    // state.currentTime = time;
    this.player.ref.seek(time);
    this.setState(state);
  }

  /**
   * Loop animation to spin loader icon. If not loading then stop loop.
   */
  loadAnimation() {
    if (this.state.loading) {
      Animated.sequence([
        Animated.timing(this.animations.loader.rotate, {
          toValue: this.animations.loader.MAX_VALUE,
          duration: 1500,
          easing: Easing.linear,
        }),
        Animated.timing(this.animations.loader.rotate, {
          toValue: 0,
          duration: 0,
          easing: Easing.linear,
        }),
      ]).start(this.loadAnimation.bind(this));
    }
  }

  calculateTime() {
    if (this.state.showTimeRemaining) {
      const time = this.state.totalDuration - this.state.currentTime;
      return `-${this.formatTime(time)}`;
    }

    return this.formatTime(this.state.currentTime);
  }
  formatTime(time = 0) {
    const symbol = this.state.showRemainingTime ? "-" : "";
    time = Math.floor(Math.min(Math.max(time, 0), this.state.totalDuration));
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);

    const formattedMinutes = minutes.toString().padStart(2, "0");
    const formattedSeconds = seconds.toString().padStart(2, "0");

    return `${symbol}${formattedMinutes}:${formattedSeconds}`;
  }

  /**
   * Set a timeout when the controls are shown
   * that hides them after a length of time.
   * Default is 15s
   */
  setControlTimeout() {
    this.player.controlTimeout = setTimeout(() => {
      this._hideControls();
    }, this.player.controlTimeoutDelay);
  }

  /**
   * Clear the hide controls timeout.
   */
  clearControlTimeout() {
    clearTimeout(this.player.controlTimeout);
  }

  /**
   * Reset the timer completely
   */
  resetControlTimeout() {
    this.clearControlTimeout();
    this.setControlTimeout();
  }

  // # Animation
  hideControlAnimation() {
    Animated.parallel([
      Animated.timing(this.animations.topControl.opacity, {
        toValue: 0,
      }),
      Animated.timing(this.animations.topControl.marginTop, { toValue: 0 }),
      Animated.timing(this.animations.bottomControl.opacity, { toValue: 0 }),
      Animated.timing(this.animations.bottomControl.marginBottom, {
        toValue: 0,
      }),
    ]).start();
  }

  /**
   * Animation to show controls...opposite of
   * above...move onto the screen and then
   * fade in.
   */
  showControlAnimation() {
    Animated.parallel([
      Animated.timing(this.animations.topControl.opacity, {
        toValue: 1,
        duration: 200,
      }),
      Animated.timing(this.animations.topControl.marginTop, { toValue: 0 }),
      Animated.timing(this.animations.bottomControl.opacity, { toValue: 1 }),
      Animated.timing(this.animations.bottomControl.marginBottom, {
        toValue: 0,
      }),
    ]).start();
  }

  showSubtitle() {
    if (!this.props.subtitle) return null;
    let currentTime = this.state.currentTimeInDeciSeconds;
    let subtitleIndex = this.state.subtitleIndex;

    const { subtitles } = this.state;
    const curSubtitle = subtitles[subtitleIndex];
    console.log("Subtitle : ", subtitleIndex + "/" + subtitles.length);
    if (!curSubtitle) return null;

    if (currentTime > curSubtitle.endTime) {
      if (currentTime - curSubtitle.endTime > 10) {
        const dIdx = subtitles
          .slice(subtitleIndex)
          .map((s) => s.endTime)
          .findIndex((s) => s.endTime >= currentTime);
        dIdx !== -1 && this.setState({ subtitleIndex: subtitleIndex + dIdx });
        return null;
      }
      this.setState({ subtitleIndex: subtitleIndex + 1 });
      return null;
    }

    if (
      currentTime < curSubtitle.endTime &&
      currentTime > curSubtitle.startTime
    ) {
      return subtitles[subtitleIndex].text;
    } else return null;
  }

  renderLoader() {
    if (this.state.loading) {
      return (
        <View style={styles.loader.container}>
          <Animated.Image
            source={require("./assets/img/loader-icon.png")}
            style={[
              styles.loader.icon,
              {
                transform: [
                  {
                    rotate: this.animations.loader.rotate.interpolate({
                      inputRange: [0, 360],
                      outputRange: ["0deg", "360deg"],
                    }),
                  },
                ],
              },
            ]}
          />
        </View>
      );
    }
    return null;
  }

  renderError() {
    if (this.state.error) {
      return (
        <View style={styles.error.container}>
          <Image
            source={require("./assets/img/error-icon.png")}
            style={styles.error.icon}
          />
          <Text style={styles.error.text}>Video unavailable</Text>
        </View>
      );
    }
    return null;
  }

  renderControl(children, callback, style = {}) {
    return (
      <TouchableHighlight
        underlayColor="transparent"
        activeOpacity={0.3}
        onPress={() => {
          this.resetControlTimeout();
          callback();
        }}
        style={[styles.controls.control, style]}
      >
        {children}
      </TouchableHighlight>
    );
  }

  renderFullscreen() {
    let source =
      this.state.isFullscreen === true
        ? require("./assets/img/my_shrink.png")
        : require("./assets/img/my_expand.png");
    return this.renderControl(
      <Image source={source} />,
      this.methods.toggleFullscreen,
      styles.controls.fullscreen
    );
  }

  renderTopControls() {
    const fullscreenControl = !this.props.disableFullscreen ? (
      this.renderFullscreen()
    ) : (
      <View />
    );

    return (
      <Animated.View
        style={[
          styles.controls.top,
          {
            opacity: this.animations.topControl.opacity,
            marginTop: this.animations.topControl.marginTop,
          },
        ]}
      >
        <ImageBackground
          source={require("./assets/img/top-vignette.png")}
          style={[styles.controls.column]}
          imageStyle={[styles.controls.vignette]}
        >
          <View style={styles.controls.topControlGroup}>
            <View />
            {fullscreenControl}
          </View>
        </ImageBackground>
      </Animated.View>
    );
  }

  renderPlayPause() {
    let source =
      this.state.paused === true
        ? require("./assets/img/play.png")
        : require("./assets/img/pause.png");
    return this.renderControl(
      <Image source={source} />,
      this.methods.togglePlayPause,
      styles.controls.playPause
    );
  }
  renderTimer() {
    return this.renderControl(
      <Text style={styles.controls.timerText}>{this.calculateTime()}</Text>,
      this.methods.toggleTimer,
      styles.controls.timer
    );
  }
  renderSeekbar() {
    // console.log(this.state.seekerPositionPercent + '%')
    console.log("Render SeekBar::TimeRate--> ", this.player.seekerWidth);
    const handleOffset = this.player.seekerWidth * this.state.timeRate;
    // console.log(handleOffset, typeof handleOffset, isNaN(handleOffset));
    // console.log('deltaX::: ', this.state.deltaXSeeking);

    return (
      <View style={styles.seekbar.container}>
        <View
          style={styles.seekbar.track}
          onLayout={(event) => {
            // console.log('#2:: ', event.nativeEvent.layout.width);
            // this.player.seekerWidth = event.nativeEvent.layout.width;
          }}
        >
          <View
            style={[
              styles.seekbar.fill,
              {
                width: (handleOffset || 0) + 5 + this.state.deltaXSeeking,
                backgroundColor: this.props.seekColor || "#FFF",
              },
            ]}
          />
        </View>
        <View
          style={[
            styles.seekbar.handle,
            { left: (handleOffset || 0) + this.state.deltaXSeeking },
          ]}
          {...this.player.seekPanResponder.panHandlers}
        >
          <View
            style={[
              styles.seekbar.circle,
              { backgroundColor: this.props.seekColor || "#FFF" },
            ]}
          />
        </View>
      </View>
    );
  }
  renderTitle() {
    if (this.opts.title) {
      return (
        <View style={[styles.controls.control, styles.controls.title]}>
          <Text
            style={[styles.controls.text, styles.controls.titleText]}
            numberOfLines={1}
          >
            {this.opts.title || ""}
          </Text>
        </View>
      );
    }

    return null;
  }

  renderBottomControls() {
    const playPauseControl = !this.props.disablePlayPause ? (
      this.renderPlayPause()
    ) : (
      <View />
    );
    const timerControl = !this.props.disableTimer ? (
      this.renderTimer()
    ) : (
      <View />
    );
    const seekbarControl = !this.props.disableSeekbar ? (
      this.renderSeekbar()
    ) : (
      <View />
    );

    return (
      <Animated.View
        style={[
          styles.controls.bottom,
          {
            opacity: this.animations.bottomControl.opacity,
            marginBottom: this.animations.bottomControl.marginBottom,
          },
        ]}
      >
        <ImageBackground
          source={require("./assets/img/bottom-vignette.png")}
          style={[styles.controls.column]}
          imageStyle={[styles.controls.vignette]}
        >
          {seekbarControl}
          <View
            style={[styles.controls.row, styles.controls.bottomControlGroup]}
          >
            {playPauseControl}
            {this.renderTitle()}
            {timerControl}
          </View>
        </ImageBackground>
      </Animated.View>
    );
  }

  renderSubtitle() {
    const subtitleToShow = this.showSubtitle();

    // console.log('SS::: ', this.showSubtitle());
    return (
      <View
        style={
          this.state.isFullscreen
            ? [
                styles.player.subtitleContainerPortrait,
                this.styles.subtitleContainerStyle,
              ]
            : [
                styles.player.subtitleContainerPortrait,
                this.styles.subtitleContainerStyle,
              ]
        }
      >
        {subtitleToShow !== null && (
          <Text style={[styles.player.subtitle, this.styles.subtitleStyle]}>
            {subtitleToShow}
          </Text>
        )}
      </View>
    );
  }

  render() {
    return (
      <TouchableWithoutFeedback
        onPress={this.events.onScreenTouch}
        style={[styles.player.container, this.styles.containerStyle]}
      >
        <View
          style={[styles.player.container, this.styles.containerStyle]}
          onLayout={({ nativeEvent: e }) => {
            this.player.seekerWidth = e.layout.width;
            console.log("#1:: ", e.layout.width);
          }}
        >
          <Video
            {...this.props}
            ref={(videoPlayer) => (this.player.ref = videoPlayer)}
            resizeMode={this.state.resizeMode}
            volume={this.props.volume || 1}
            paused={this.state.paused}
            muted={this.state.muted}
            rate={this.state.rate}
            onLoadStart={this.events.onLoadStart}
            onProgress={this.events.onProgress}
            onError={this.events.onError}
            onLoad={this.events.onLoad}
            onEnd={this.events.onEnd}
            style={[styles.player.video, this.styles.videoStyle]}
            source={this.props.source}
          />

          {this.props.subtitle ? this.renderSubtitle() : null}
          {this.state.showControls &&
            !this.props.disableFullscreen &&
            this.renderTopControls()}
          {this.state.showControls && this.renderBottomControls()}
          {!this.props.disableLoader ? this.renderLoader() : null}
          {!this.props.disableError ? this.renderError() : null}
          {/* 
          {!this.props.disableBack ||
          !this.props.disableVolume ||
          !this.props.disableFullscreen
            ? this.renderTopControls()
            : null}
          
          {!this.props.disablePlayPause ||
          !this.props.disableTimer ||
          !this.props.disableSeekbar
            ? this.renderBottomControls()
            : null} */}
        </View>
      </TouchableWithoutFeedback>
    );
  }
}

const styles = {
  player: StyleSheet.create({
    container: {
      backgroundColor: "#000",
      flex: 1,
      alignSelf: "stretch",
      justifyContent: "space-between",
    },
    subtitle: {
      color: "white",
      textAlign: "center",
      textShadowColor: "black",
      textShadowOffset: { width: 1, height: 1 },
      backgroundColor: "#222222aa",
      paddingRight: 7,
      paddingLeft: 7,
      paddingVertical: 2,
    },
    subtitleContainerPortrait: {
      position: "absolute",
      // top: 200,
      bottom: 15,
      width: "100%",
      alignItems: "center",
    },
    subtitleContainerLandscape: {
      position: "absolute",
      bottom: 50,
      width: "100%",
      // left: 250,
    },
    video: {
      overflow: "hidden",
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
  }),
  error: StyleSheet.create({
    container: {
      backgroundColor: "rgba( 0, 0, 0, 0.5 )",
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      justifyContent: "center",
      alignItems: "center",
    },
    icon: {
      marginBottom: 16,
    },
    text: {
      backgroundColor: "transparent",
      color: "#f27474",
    },
  }),
  loader: StyleSheet.create({
    container: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      alignItems: "center",
      justifyContent: "center",
    },
  }),
  controls: StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      height: null,
      width: null,
    },
    column: {
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "space-between",
      height: null,
      width: null,
    },
    vignette: {
      resizeMode: "stretch",
    },
    control: {
      padding: 16,
    },
    text: {
      backgroundColor: "transparent",
      color: "#FFF",
      fontSize: 14,
      textAlign: "center",
    },
    top: {
      flex: 1,
      alignItems: "stretch",
      justifyContent: "flex-start",
    },
    bottom: {
      alignItems: "stretch",
      flex: 2,
      justifyContent: "flex-end",
    },
    topControlGroup: {
      alignSelf: "stretch",
      alignItems: "center",
      justifyContent: "space-between",
      flexDirection: "row",
      width: null,
      margin: 12,
      marginBottom: 18,
    },
    bottomControlGroup: {
      alignSelf: "stretch",
      alignItems: "center",
      justifyContent: "space-between",
      marginLeft: 12,
      marginRight: 12,
      marginBottom: 0,
    },
    fullscreen: {
      flexDirection: "row",
    },
    playPause: {
      position: "relative",
      width: 80,
      zIndex: 0,
    },
    title: {
      alignItems: "center",
      flex: 0.6,
      flexDirection: "column",
      padding: 0,
    },
    titleText: {
      textAlign: "center",
    },
    timer: {
      width: 80,
    },
    timerText: {
      backgroundColor: "transparent",
      color: "#FFF",
      fontSize: 11,
      textAlign: "right",
    },
  }),
  seekbar: StyleSheet.create({
    container: {
      alignSelf: "stretch",
      height: 28,
      marginLeft: 20,
      marginRight: 20,
    },
    // # track
    track: {
      backgroundColor: "#333",
      height: 1,
      position: "relative",
      top: 14,
      width: "100%",
    },
    fill: {
      backgroundColor: "#FFF",
      height: 1,
      width: "100%",
    },
    handle: {
      position: "absolute",
      marginLeft: -7,
      height: 45,
      width: 45,
    },
    circle: {
      borderRadius: 12,
      position: "relative",
      top: 8,
      left: 8,
      height: 12,
      width: 12,
    },
  }),
};
