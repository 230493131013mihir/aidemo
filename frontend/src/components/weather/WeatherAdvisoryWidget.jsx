/**
 * WeatherAdvisoryWidget.jsx
 * Weather Forecast & District Rain Advisory Component
 * Supports English, Hindi, Gujarati, Marathi
 * HarvestMitra AI - ISSUE-11
 */

import React, { useState, useEffect } from 'react';
import {
  CloudRain,
  Sun,
  CloudSun,
  Wind,
  Droplets,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Clock,
  ShieldAlert,
  ArrowRight,
  Info,
  Thermometer
} from 'lucide-react';
import { fetchWeather } from '../../services/weatherApiService';

const I18N = {
  en: {
    title: 'Weather & District Rain Advisory',
    subtitle: 'Localized weather forecasts to support harvest timing & transport logistics',
    selectDistrict: 'Select District:',
    currentWeather: 'Current Weather',
    rainProbability: 'Rain Probability',
    humidity: 'Humidity',
    wind: 'Wind Speed',
    rainfall: 'Rainfall',
    forecastTitle: '3-Day Forecast',
    advisoryActive: 'District Rain Advisory Active',
    advisoryClear: 'Favorable Weather Conditions',
    actionTipsTitle: 'Recommended Actions for Farmers:',
    simulatorAction: 'Review Harvest Timing & Transport Plans',
    demoNotice: 'Demo Weather Data',
    demoNoticeSub: 'Live weather service is not configured. Information shown is for demonstration only.',
    lastUpdated: 'Last Updated:',
    loading: 'Fetching district weather data...',
    errorTitle: 'Unable to retrieve weather data'
  },
  hi: {
    title: 'मौसम एवं जिला वर्षा परामर्श',
    subtitle: 'फसल कटाई और परिवहन के सही निर्णय हेतु स्थानीय मौसम पूर्वानुमान',
    selectDistrict: 'जिला चुनें:',
    currentWeather: 'वर्तमान मौसम',
    rainProbability: 'बारिश की संभावना',
    humidity: 'नमी (आर्द्रता)',
    wind: 'हवा की गति',
    rainfall: 'वर्षा मात्रा',
    forecastTitle: '3-दिवसीय पूर्वानुमान',
    advisoryActive: 'जिला वर्षा परामर्श जारी',
    advisoryClear: 'अनुकूल मौसम स्थिति',
    actionTipsTitle: 'किसानों के लिए अनुशंसित सुझाव:',
    simulatorAction: 'कटाई समय व परिवहन योजना की समीक्षा करें',
    demoNotice: 'डेमो मौसम डेटा',
    demoNoticeSub: 'लाइव मौसम सेवा कॉन्फ़िगर नहीं है। दिखाई गई जानकारी केवल डेमो उद्देश्य के लिए है।',
    lastUpdated: 'अंतिम अपडेट:',
    loading: 'जिले का मौसम डेटा लोड हो रहा है...',
    errorTitle: 'मौसम डेटा प्राप्त करने में असमर्थ'
  },
  gu: {
    title: 'હવામાન અને જિલ્લા વરસાદ સલાહ',
    subtitle: 'લણણીનો સમય અને પરિવહનના યોગ્ય આયોજન માટે સ્થાનિક હવામાન આગાહી',
    selectDistrict: 'જિલ્લો પસંદ કરો:',
    currentWeather: 'હાલનું હવામાન',
    rainProbability: 'વરસાદની સંભાવના',
    humidity: 'ભેજનું પ્રમાણ',
    wind: 'પવનની ઝડપ',
    rainfall: 'વરસાદ',
    forecastTitle: '3-દિવસીય આગાહી',
    advisoryActive: 'જિલ્લા વરસાદ સલાહ સક્રિય',
    advisoryClear: 'અનુકૂળ હવામાન સ્થિતિ',
    actionTipsTitle: 'ખેડૂતો માટે ભલામણ કરેલ પગલાં:',
    simulatorAction: 'લણણી સમય અને વાહન યોજનાની સમીક્ષા કરો',
    demoNotice: 'ડેમો હવામાન ડેટા',
    demoNoticeSub: 'લાઈવ હવામાન સેવા સેટ કરેલ નથી. દર્શાવેલ માહિતી માત્ર ડેમો પ્રદર્શન માટે છે.',
    lastUpdated: 'છેલ્લે અપડેટ:',
    loading: 'જિલ્લાની હવામાન માહિતી લોડ થઈ રહી છે...',
    errorTitle: 'હવામાન માહિતી મેળવવામાં અસમર્થ'
  },
  mr: {
    title: 'हवामान आणि जिल्हा पाऊस सल्लागार',
    subtitle: 'काढणीची योग्य वेळ आणि वाहतूक नियोजनासाठी स्थानिक हवामान अंदाज',
    selectDistrict: 'जिल्हा निवडा:',
    currentWeather: 'सध्याचे हवामान',
    rainProbability: 'पावसाची शक्यता',
    humidity: 'आर्द्रता (ओलावा)',
    wind: 'वाऱ्याचा वेग',
    rainfall: 'पावसाचे प्रमाण',
    forecastTitle: '3-दिवसीय हवामान अंदाज',
    advisoryActive: 'जिल्हा पाऊस सतर्कता सल्ला',
    advisoryClear: 'काढणीसाठी अनुकूल हवामान',
    actionTipsTitle: 'शेतकऱ्यांसाठी महत्त्वाच्या कृती:',
    simulatorAction: 'काढणी वेळ आणि वाहतूक नियोजनाचा आढावा घ्या',
    demoNotice: 'डेमो हवामान डेटा',
    demoNoticeSub: 'थेट हवामान सेवा कॉन्फिगर केलेली नाही. माहिती केवळ प्रात्यक्षिकासाठी आहे.',
    lastUpdated: 'शेवटचे अपडेट:',
    loading: 'जिल्ह्याची हवामान माहिती लोड होत आहे...',
    errorTitle: 'हवामान माहिती मिळवण्यात अडचण'
  }
};

const DISTRICT_OPTIONS = [
  { name: 'Surat', state: 'Gujarat' },
  { name: 'Navsari', state: 'Gujarat' },
  { name: 'Ahmedabad', state: 'Gujarat' },
  { name: 'Rajkot', state: 'Gujarat' },
  { name: 'Bharuch', state: 'Gujarat' },
  { name: 'Nashik', state: 'Maharashtra' },
  { name: 'Pune', state: 'Maharashtra' }
];

export default function WeatherAdvisoryWidget({
  selectedLanguage = 'en',
  onNavigateToSimulator = null
}) {
  const t = I18N[selectedLanguage] || I18N.en;

  const [selectedDistrict, setSelectedDistrict] = useState('Surat');
  const [selectedState, setSelectedState] = useState('Gujarat');
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadWeather = async (district, state) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchWeather(district, state);
      setWeatherData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeather(selectedDistrict, selectedState);
  }, [selectedDistrict, selectedState]);

  const handleDistrictChange = (distName) => {
    const found = DISTRICT_OPTIONS.find(d => d.name === distName);
    setSelectedDistrict(distName);
    if (found) setSelectedState(found.state);
  };

  const isRainAdvisory = weatherData?.advisory?.level === 'RAIN_ADVISORY';
  const rainProb = weatherData?.weather?.rainProbability ?? 0;

  return (
    <div className="bg-stone-50 border border-emerald-200/80 rounded-2xl shadow-xl overflow-hidden flex flex-col font-sans">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-900 via-teal-900 to-stone-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-700/50 flex items-center justify-center text-lg">
              🌦️
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              {t.title}
            </h2>
          </div>
          <p className="text-xs text-emerald-200/80 mt-0.5">
            {t.subtitle}
          </p>
        </div>

        {/* District Selector Dropdown */}
        <div className="flex items-center gap-2 bg-emerald-950/70 border border-emerald-700/50 px-3 py-1.5 rounded-xl self-start sm:self-auto text-xs">
          <span className="text-emerald-300 font-medium shrink-0">{t.selectDistrict}</span>
          <select
            value={selectedDistrict}
            onChange={(e) => handleDistrictChange(e.target.value)}
            className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
          >
            {DISTRICT_OPTIONS.map((d) => (
              <option key={d.name} value={d.name} className="bg-emerald-950 text-white">
                {d.name} ({d.state})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center text-emerald-800 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
            <span className="text-sm font-semibold">{t.loading}</span>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center text-red-700">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-600" />
            <h3 className="font-bold text-sm">{t.errorTitle}</h3>
            <p className="text-xs mt-1 text-red-600">{error}</p>
          </div>
        ) : weatherData ? (
          <>
            {/* 1. District Rain Advisory Banner */}
            <div
              className={`p-4 rounded-2xl border transition-all shadow-sm ${
                isRainAdvisory
                  ? 'bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-orange-500/10 border-amber-400 text-amber-950'
                  : 'bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-teal-500/10 border-emerald-300 text-emerald-950'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                    isRainAdvisory ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
                  }`}
                >
                  {isRainAdvisory ? (
                    <AlertTriangle className="w-5 h-5 animate-bounce" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold tracking-tight">
                      {isRainAdvisory ? t.advisoryActive : t.advisoryClear}
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                        isRainAdvisory
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      }`}
                    >
                      {weatherData.advisory.level}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm mt-1 leading-relaxed text-gray-700">
                    {weatherData.advisory.message}
                  </p>

                  {/* Reason explanation */}
                  <div className="mt-1.5 text-xs text-gray-500 font-medium">
                    {weatherData.advisory.reason}
                  </div>

                  {/* Actionable Tips */}
                  {weatherData.advisory.actionableTips?.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-gray-200/60">
                      <span className="text-xs font-bold text-gray-800 block mb-1">
                        {t.actionTipsTitle}
                      </span>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {weatherData.advisory.actionableTips.map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-emerald-700 font-bold">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Simulator connection link */}
                  {onNavigateToSimulator && (
                    <div className="mt-3.5">
                      <button
                        type="button"
                        onClick={onNavigateToSimulator}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs transition-colors"
                      >
                        <span>{t.simulatorAction}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Key Weather Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Temperature */}
              <div className="bg-white border border-emerald-100 rounded-xl p-3.5 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Temperature</span>
                  <Thermometer className="w-4 h-4 text-orange-500" />
                </div>
                <div className="my-1">
                  <span className="text-2xl font-extrabold text-gray-900">
                    {weatherData.weather.temperature}°C
                  </span>
                </div>
                <span className="text-[11px] text-gray-600 font-medium truncate">
                  {weatherData.weather.condition}
                </span>
              </div>

              {/* Rain Probability */}
              <div className="bg-white border border-emerald-100 rounded-xl p-3.5 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{t.rainProbability}</span>
                  <CloudRain className="w-4 h-4 text-teal-600" />
                </div>
                <div className="my-1">
                  <span className="text-2xl font-extrabold text-teal-900">
                    {rainProb}%
                  </span>
                </div>
                {/* Progress Meter */}
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      rainProb >= 60 ? 'bg-amber-500' : 'bg-teal-500'
                    }`}
                    style={{ width: `${Math.min(rainProb, 100)}%` }}
                  />
                </div>
              </div>

              {/* Humidity */}
              <div className="bg-white border border-emerald-100 rounded-xl p-3.5 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{t.humidity}</span>
                  <Droplets className="w-4 h-4 text-blue-500" />
                </div>
                <div className="my-1">
                  <span className="text-2xl font-extrabold text-gray-900">
                    {weatherData.weather.humidity}%
                  </span>
                </div>
                <span className="text-[11px] text-gray-400">Relative Humidity</span>
              </div>

              {/* Wind Speed */}
              <div className="bg-white border border-emerald-100 rounded-xl p-3.5 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{t.wind}</span>
                  <Wind className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="my-1">
                  <span className="text-2xl font-extrabold text-gray-900">
                    {weatherData.weather.windSpeedKmh}
                  </span>
                  <span className="text-xs text-gray-500 ml-1">km/h</span>
                </div>
                <span className="text-[11px] text-gray-400">Wind Velocity</span>
              </div>
            </div>

            {/* 3. 3-Day Forecast Cards */}
            {weatherData.weather.forecast?.length > 0 && (
              <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-2xs">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <CloudSun className="w-4 h-4 text-emerald-600" />
                  <span>{t.forecastTitle}</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {weatherData.weather.forecast.map((fc, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-stone-50 border border-gray-100 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-xs text-gray-800">{fc.day}</div>
                        <div className="text-[11px] text-gray-500">{fc.condition}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-900">{fc.temp}°C</div>
                        <div className={`text-[10px] font-semibold ${fc.rainProbability >= 60 ? 'text-amber-600' : 'text-teal-600'}`}>
                          {fc.rainProbability}% Rain
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Demo Data Source Notice */}
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">{t.demoNotice}: </span>
                <span>{t.demoNoticeSub}</span>
                <div className="mt-1 text-[11px] text-amber-700/80 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{t.lastUpdated} {new Date(weatherData.lastUpdated).toLocaleTimeString()} ({weatherData.source})</span>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
