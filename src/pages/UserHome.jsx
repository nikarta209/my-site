import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Book } from "@/api/entities";
import { Purchase } from "@/api/entities";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import BannerCarousel from "../components/home/BannerCarousel";
import GenreSections from "../components/home/GenreSections";
import AIRecommendationSection from "../components/home/AIRecommendationSection";

export default function UserHome() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await User.me();
        setUser(userData);
      } catch (error) {
        // Not logged in
      }
      setIsLoading(false);
    };
    loadUser();
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <BannerCarousel />
      
      <AIRecommendationSection />
      
      <div className="max-w-7xl mx-auto">
        <GenreSections />
      </div>
    </div>
  );
}