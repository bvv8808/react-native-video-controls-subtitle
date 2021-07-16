import React from "react";
import { TextStyle, ViewStyle } from "react-native";

export type TSubtitle = {
  startTime: string;
  endTime: string;
  text: string;
};

export interface IProps {
  resizeMode?: "stretch" | "contain" | "cover" | "none";
  paused?: boolean;
  source: { uri?: string; headers?: { [key: string]: string } } | number;
  style?: ViewStyle;
  subtitle?: TSubtitle[];
  subtitleStyle?: TextStyle;
  subtitleContainerStyle?: ViewStyle;
  containerStyle?: ViewStyle;
  videoStyle?: ViewStyle;
  useNativeDriver?: boolean;
  volumn?: number;
  muted?: number;
  rate?: number;
  playWhenInactive?: boolean;
  playInBackground?: boolean;
  repeat?: boolean;
  disableFullscreen?: boolean;
  disablePlayPause?: boolean;
  disableTimer?: boolean;
  disableSeekbar?: boolean;
  disableError?: boolean;
  disableLoader?: boolean;
  toggleFullscreen?: (changedFullscreenMode?: boolean) => void;

  onError?: () => void;
  onEnd?: () => void;
  onLoadStart?: () => void;
  onLoad?: () => void;
  onProgress?: () => void;
  onFullscreenPlayerWillPresent?: () => void;
  onFullscreenPlayerWillDismiss?: () => void;
}

export interface IState {}

export default class VideoPlayer extends React.Component<IProps> {}
