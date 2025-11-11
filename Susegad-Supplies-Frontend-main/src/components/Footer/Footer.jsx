import React from 'react';

function Footer() {
    return (
        <footer>
            <div className="container">
                <p>© {new Date().getFullYear()} Susegad Supplies. All Rights Reserved.</p>
            </div>
        </footer>
    );
}

export default Footer;