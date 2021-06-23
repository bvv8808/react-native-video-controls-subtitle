import React from "react";
import { TextStyle, ViewStyle } from "react-native";

export type TSubtitle = {
    startTime: string;
    endTime: string;
    text: string;
}

export default class VideoPlayer extends React.Component {
    resizeMode?: "stretch" | "contain" | "cover" | "none";
    paused?: boolean;
    source: { uri?: string, headers?: {[key: string]: string } } | number;
    style?: ViewStyle;
    subtitle?: TSubtitle[];
    subtitleStyle?: TextStyle;
    subtitleContainerStyle?: ViewStyle;
    videoStyle?: ViewStyle;
    useNativeDriver?: boolean;
    volumn?: number;
    muted?: number;
    rate?: number;
    playWhenInactive?: boolean;
    playInBackground?: boolean;
    repeat?: boolean;
    title?: string;
    controlTimeout?: number;
    navigator?: any;
    disableBack?: boolean;
    disableVolumn?: boolean;
    disableFullscreen?: boolean;
    disablePlayPause?: boolean;
    disableTimer?: boolean;
    disableSeekbar?: boolean;
    disableError?: boolean;
    disableLoader?: boolean;
    isFullscreen?: boolean;
    seekColor?: string;
    toggleFullScreen?: () => void;
    onError?: () => void;
    onEnd?: () => void;
    onBack?: () => void;
    onLoadStart?: () => void;
    onLoad?: () => void;
    onProgress?: () => void;
}