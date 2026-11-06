import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import bgImage from '../../assets/Imagem_Login.jpg'; 

import { FormField } from '../../shared/components/FormField';
import { authService } from '../../shared/services/authService';
import { API_URL } from '../../utils/api';

export default function RegisterFormComponent(props) {
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    cep: "",
    numero: "",
    foto: null
  });
  const [fotoPreview, setFotoPreview] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    // Mesmo endereço do back usado pelo api.js (definido no .env); o login do Google começa nele
    window.location = API_URL;  // BACK URL
  },[])

  return(
    <div>

    </div>
  )
}