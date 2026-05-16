import React from 'react';
import SpotifyIcon from '../../components/shared/SpotifyIcon';

const CustomFooter: React.FC = () => {
    return (
        <footer className="w-full bg-base pt-12 pb-18 px-8 border-t border-border mt-auto shrink-0">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-10">
                {/* Cột 1 */}
                <div className="flex flex-col gap-4 max-w-sm">
                    <div className="flex items-center gap-2 text-text-main">
                        <div className="w-10 h-10 bg-highlight/10 text-highlight rounded-full flex items-center justify-center">
                            <SpotifyIcon />
                        </div>
                        <span className="text-xl font-bold tracking-tight">Spotify Clone</span>
                    </div>
                    <p className="text-text-sub text-sm leading-relaxed">
                        Enjoy ad-free music listening, offline downloads, and highest audio quality. Music for everyone.
                    </p>
                </div>

                {/* Cột 2 - contact */}
                <div className="flex gap-16">
                    <div className="flex flex-col gap-3">
                        <h4 className="text-text-main font-bold text-sm uppercase tracking-wider">Company</h4>
                        <a href="#" className="text-text-sub text-sm hover:text-highlight transition-colors">About</a>
                        <a href="#" className="text-text-sub text-sm hover:text-highlight transition-colors">Jobs</a>
                        <a href="#" className="text-text-sub text-sm hover:text-highlight transition-colors">For the Record</a>
                    </div>
                    <div className="flex flex-col gap-3">
                        <h4 className="text-text-main font-bold text-sm uppercase tracking-wider">Communities</h4>
                        <a href="#" className="text-text-sub text-sm hover:text-highlight transition-colors">For Artists</a>
                        <a href="#" className="text-text-sub text-sm hover:text-highlight transition-colors">Developers</a>
                        <a href="#" className="text-text-sub text-sm hover:text-highlight transition-colors">Investors</a>
                    </div>
                </div>
            </div>

            {/* Copyright */}
            <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex gap-4 text-xs text-text-sub">
                    <a href="#" className="hover:text-text-main transition-colors">Legal</a>
                    <a href="#" className="hover:text-text-main transition-colors">Privacy Center</a>
                    <a href="#" className="hover:text-text-main transition-colors">Cookies</a>
                </div>
                <p className="text-xs text-text-sub">
                    &copy; {new Date().getFullYear()} Spotify Clone JSC. All rights reserved.
                </p>
            </div>
        </footer>
    );
};

export default CustomFooter;