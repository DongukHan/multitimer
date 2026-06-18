import { Platform, View } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

const ANDROID_ID = TestIds.BANNER; // 출시 전 실 ID로 교체
const IOS_ID = TestIds.BANNER;

export default function AdBanner() {
  const adUnitId = Platform.OS === 'ios' ? IOS_ID : ANDROID_ID;
  return (
    <View style={{ alignItems: 'center' }}>
      <BannerAd unitId={adUnitId} size={BannerAdSize.BANNER} />
    </View>
  );
}
