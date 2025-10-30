import React, { useEffect } from 'react';
import { motion } from "framer-motion";
import { Navbar } from '../../components/landing/Navbar';
import { Footer } from '../../components/landing/Footer';
import { ScrollUpButton } from '../../components/landing/ScrollUpButton';

// Importar estilos específicos
import '../../styles/landing/index.css';

// Importar imágenes
import blog1 from "../../assets/images/blog1.png";
import blog2 from "../../assets/images/blog2.png";
import blog3 from "../../assets/images/blog3.png";

const blogPosts = [
  {
    id: 1,
    title: "Facturación electrónica SUNAT",
    subtitle: "Cómo automatizar tu negocio y emitir comprobantes válidos sin errores.",
    content: "La facturación electrónica se ha convertido en un requisito indispensable para las empresas en Perú. Con HoryCore ERP, puedes automatizar completamente este proceso, garantizando el cumplimiento con SUNAT y eliminando errores manuales. Nuestro sistema integra directamente con los servicios de SUNAT, permitiendo la emisión automática de facturas, boletas y notas de crédito.",
    image: blog1,
    date: "15 de Septiembre, 2025",
    author: "Equipo HoryCore",
    readTime: "5 min de lectura"
  },
  {
    id: 2,
    title: "Controla tu almacén en tiempo real",
    subtitle: "Evita quiebres de stock y mejora tus tiempos de entrega.",
    content: "El control de inventario en tiempo real es crucial para el éxito de cualquier empresa. Con HoryCore ERP, puedes monitorear tus existencias al instante, configurar alertas de stock mínimo y optimizar tus procesos de reposición. Esto te permite evitar quiebres de stock y mejorar significativamente tus tiempos de entrega.",
    image: blog2,
    date: "12 de Septiembre, 2025",
    author: "Equipo HoryCore",
    readTime: "4 min de lectura"
  },
  {
    id: 3,
    title: "Gestión de ventas sin complicaciones",
    subtitle: "Vende más y mejor con reportes, kardex y seguimiento de clientes.",
    content: "La gestión eficiente de ventas es la clave para el crecimiento empresarial. HoryCore ERP te proporciona herramientas avanzadas para el seguimiento de clientes, generación de reportes detallados y control del kardex. Simplifica tu proceso de ventas y toma decisiones basadas en datos reales.",
    image: blog3,
    date: "10 de Septiembre, 2025",
    author: "Equipo HoryCore",
    readTime: "6 min de lectura"
  }
];

const BlogPage = () => {
  // Añade/remueve una clase al body para aislar estilos
  useEffect(() => {
    document.body.classList.add('landing-body');
    return () => {
      document.body.classList.remove('landing-body');
    };
  }, []);

  return (
    <div className="landing-page" data-theme="blog">
      <Navbar />
      
      {/* Hero Section */}
      <section className="w-full relative overflow-hidden bg-gradient-to-br from-bgDark1 via-bgDark2 to-bgDark1 pt-20">
        <div className="absolute inset-0 bg-gradient-to-r from-secondary-color/5 to-primary-color/5"></div>
        <div className="absolute top-20 right-10 w-96 h-96 bg-gradient-to-br from-secondary-color/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-64 h-64 bg-gradient-to-tr from-primary-color/20 to-transparent rounded-full blur-2xl"></div>
        
        <div className="relative z-10 flex justify-center px-2 sm:px-4 py-24">
          <div className="w-full md:w-10/12 lg:w-[1200px] 2xl:w-[1400px]">
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <motion.div 
                className="inline-flex items-center bg-gradient-to-r from-secondary-color/20 to-primary-color/20 rounded-full px-6 py-3 mb-8 border border-secondary-color/30"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="w-2 h-2 bg-secondary-color rounded-full mr-3 animate-pulse"></div>
                <span className="text-secondary-color font-semibold text-sm">Blog HoryCore</span>
              </motion.div>
              
              <motion.h1 
                className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                Consejos para{" "}
                <span className="bg-gradient-to-r from-secondary-color to-primary-color bg-clip-text text-transparent">
                  optimizar
                </span>{" "}
                tu negocio
              </motion.h1>
              
              <motion.p 
                className="text-xl md:text-2xl text-secondary-text max-w-4xl mx-auto mb-12 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                Aprende sobre gestión empresarial, control de inventario, facturación electrónica y más con{" "}
                <span className="text-white font-semibold">HoryCore ERP</span>.
              </motion.p>
              
              <motion.div 
                className="w-32 h-1 bg-gradient-to-r from-secondary-color to-primary-color mx-auto rounded-full"
                initial={{ width: 0 }}
                animate={{ width: "8rem" }}
                transition={{ duration: 0.8, delay: 0.8 }}
              ></motion.div>
            </motion.div>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-secondary-color/50 to-transparent"></div>
      </section>

      {/* Blog Posts Section */}
      <section className="w-full py-20 bg-gradient-to-b from-bgDark2 to-bgDark1">
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {blogPosts.map((post, index) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-bgDark2/80 to-bgDark3/60 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-gray-700/30 hover:shadow-3xl hover:shadow-secondary-color/10 transition-all duration-300 group"
              >
                <div className="relative overflow-hidden rounded-2xl mb-6">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-bgDark1/80 to-transparent"></div>
                </div>
                
                <div className="flex items-center gap-4 mb-4 text-sm text-secondary-text">
                  <span>{post.date}</span>
                  <span>•</span>
                  <span>{post.readTime}</span>
                </div>
                
                <h2 className="text-xl font-bold text-white mb-3 group-hover:text-secondary-color transition-colors duration-300">
                  {post.title}
                </h2>
                
                <p className="text-secondary-text mb-4 leading-relaxed">
                  {post.subtitle}
                </p>
                
                <p className="text-secondary-text/80 text-sm leading-relaxed mb-6">
                  {post.content}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary-text">Por {post.author}</span>
                </div>
              </motion.article>
            ))}
          </div>
          
          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <div className="bg-gradient-to-r from-bgDark2/80 to-bgDark3/60 backdrop-blur-sm rounded-3xl p-8 border border-gray-700/30">
              <h3 className="text-2xl font-bold text-white mb-4">
                ¿Listo para optimizar tu negocio?
              </h3>
              <p className="text-secondary-text mb-6">
                Descubre cómo HoryCore ERP puede transformar la gestión de tu empresa
              </p>
              <a
                href="/landing/contactanos"
                className="inline-flex items-center bg-gradient-to-r from-secondary-color to-primary-color hover:from-primary-color hover:to-secondary-color text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-secondary-color/25"
              >
                Contáctanos hoy
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
      <ScrollUpButton />
    </div>
  );
};

export default BlogPage;