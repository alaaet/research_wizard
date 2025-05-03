
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface TabItem {
  value: string;
  label: string;
  content: React.ReactNode;
}

interface TabContainerProps {
  tabs: TabItem[];
  defaultValue: string;
  onValueChange?: (value: string) => void;
}

const TabContainer = ({ tabs, defaultValue, onValueChange }: TabContainerProps) => {
  const [activeTab, setActiveTab] = useState(defaultValue);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);
  
  const tabsListRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Update the active tab when defaultValue changes
    setActiveTab(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    const checkScroll = () => {
      if (tabsListRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = tabsListRef.current;
        setShowLeftScroll(scrollLeft > 0);
        setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 5);
      }
    };

    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const handleScroll = () => {
    if (tabsListRef.current) {
      const { scrollLeft } = tabsListRef.current;
      setScrollPosition(scrollLeft);
      setShowLeftScroll(scrollLeft > 0);
      setShowRightScroll(
        scrollLeft < tabsListRef.current.scrollWidth - tabsListRef.current.clientWidth - 5
      );
    }
  };

  const scrollLeft = () => {
    if (tabsListRef.current) {
      tabsListRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (tabsListRef.current) {
      tabsListRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  const handleValueChange = (value: string) => {
    setActiveTab(value);
    if (onValueChange) {
      onValueChange(value);
    }
  };

  return (
    <div className="relative w-full">
      <Tabs
        value={activeTab}
        onValueChange={handleValueChange}
        className="w-full"
      >
        <div className="relative flex items-center mb-6">
          {showLeftScroll && (
            <button 
              onClick={scrollLeft}
              className="absolute left-0 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md hover:bg-gray-100 transition-all"
              aria-label="Scroll tabs left"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          
          <TabsList 
            ref={tabsListRef}
            className="mb-0 w-full justify-start overflow-x-auto scrollbar-none flex-nowrap"
            onScroll={handleScroll}
          >
            {tabs.map(tab => (
              <TabsTrigger 
                key={tab.value} 
                value={tab.value}
                className="transition-all duration-200 whitespace-nowrap"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {showRightScroll && (
            <button 
              onClick={scrollRight}
              className="absolute right-0 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md hover:bg-gray-100 transition-all"
              aria-label="Scroll tabs right"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>
        
        {tabs.map(tab => (
          <TabsContent
            key={tab.value}
            value={tab.value}
            className="animate-fade-in transition-all duration-300"
          >
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default TabContainer;
