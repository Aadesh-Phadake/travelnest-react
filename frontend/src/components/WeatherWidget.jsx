import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Cloud, Sun, CloudRain, Wind, Loader, Droplets, MapPin } from 'lucide-react';

const WeatherWidget = ({ location, country }) => {
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    
    const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY; 

    useEffect(() => {
        const fetchWeather = async () => {
            if (!location || !API_KEY) return;
            
            setLoading(true);
            setError(false);

            // 1. Build a list of potential search queries
            // Example: location="Anjuna Beach, Goa", country="India"
            // Queries: ["Anjuna Beach", "Goa", "India"]
            const locationParts = location.split(',').map(s => s.trim());
            const searchQueries = [...locationParts, country].filter(Boolean);

            // 2. Try each query one by one until success
            for (const query of searchQueries) {
                try {
                    // Skip very short strings (like state codes "GA" might be ambiguous)
                    if (query.length <= 2) continue;

                    const url = `https://api.openweathermap.org/data/2.5/weather?q=${query}&units=metric&appid=${API_KEY}`;
                    const res = await axios.get(url);
                    
                    // If successful, save data and STOP loop
                    setWeather(res.data);
                    setLoading(false);
                    return; 
                } catch (err) {
                    console.log(`Weather not found for "${query}", trying next...`);
                    // Continue to next iteration
                }
            }

            // 3. If loop finishes without success
            console.error("All weather queries failed");
            setError(true);
            setLoading(false);
        };

        fetchWeather();
    }, [location, country, API_KEY]);

    if (loading) return (
        <div className="flex items-center gap-2 text-gray-400 text-sm mt-2">
            <Loader className="animate-spin w-4 h-4"/> 
            <span>Checking forecast...</span>
        </div>
    );
    
    if (error || !weather) return null;

    // Helper for icons
    const getWeatherIcon = (main) => {
        switch(main) {
            case 'Clear': return <Sun className="w-8 h-8 text-yellow-500" />;
            case 'Clouds': return <Cloud className="w-8 h-8 text-gray-400" />;
            case 'Rain': return <CloudRain className="w-8 h-8 text-blue-400" />;
            case 'Drizzle': return <CloudRain className="w-8 h-8 text-blue-300" />;
            case 'Thunderstorm': return <CloudRain className="w-8 h-8 text-purple-500" />;
            default: return <Wind className="w-8 h-8 text-blue-300" />;
        }
    };

    return (
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex items-center justify-between min-w-[200px] mt-2 animate-in fade-in">
            <div>
                <div className="flex items-center gap-1 mb-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {weather.name} Weather
                    </p>
                </div>
                <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold text-gray-800">{Math.round(weather.main.temp)}°</span>
                    <span className="text-sm text-gray-600 mb-1 font-medium">{weather.weather[0].main}</span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Droplets className="w-3 h-3" /> {weather.main.humidity}%
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Wind className="w-3 h-3" /> {Math.round(weather.wind.speed)} km/h
                    </p>
                </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-full">
                {getWeatherIcon(weather.weather[0].main)}
            </div>
        </div>
    );
};

export default WeatherWidget;