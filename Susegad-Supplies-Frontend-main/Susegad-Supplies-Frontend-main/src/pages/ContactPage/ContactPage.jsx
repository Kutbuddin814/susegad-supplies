import React from 'react';
import './ContactPage.css';

function ContactPage() {
    return (
        <section id="contact-page">
            <div className="container">
                <h1 className="page-title">Get In Touch</h1>
                <p className="contact-subtitle">We'd love to hear from you! Reach out with any questions or for placing an order.</p>
                <div className="contact-grid">
                    <div className="contact-card"><div className="contact-icon"><img src="https://api.iconify.design/mdi/map-marker-outline.svg?color=%236a994e" alt="Location"/></div><h3>Our Location</h3><p>Madgaon, Goa, India</p></div>
                    <div className="contact-card"><div className="contact-icon"><img src="https://api.iconify.design/mdi/phone-outline.svg?color=%236a994e" alt="Phone"/></div><h3>Phone / WhatsApp</h3><p><a href="tel:+919876543210">+91 98765 43210</a></p></div>
                    <div className="contact-card"><div className="contact-icon"><img src="https://api.iconify.design/mdi/email-outline.svg?color=%236a994e" alt="Email"/></div><h3>Email for Inquiries</h3><p><a href="mailto:orders@susegadsupplies.com">orders@susegadsupplies.com</a></p></div>
                </div>
                <div className="contact-map">
                    <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d61556.71883804803!2d73.9224026486328!3d15.2782089!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bbfb3b57116d213%3A0x1031c96d9e03565!2sMadgaon%2C%20Goa!5e0!3m2!1sen!2sin!4v1672834612345!5m2!1sen!2sin" width="600" height="450" style={{ border: 0 }} allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
                </div>
            </div>
        </section>
    );
}

export default ContactPage;