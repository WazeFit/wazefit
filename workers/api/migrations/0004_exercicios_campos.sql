-- Migration 0004: Adiciona campos tipo_exercicio e subtipo à tabela exercicios
-- tipo_exercicio: forca, aerobico, funcional
-- subtipo: mobilidade, dinamico, cardio, hipertrofia, resistencia, flexibilidade, potencia

ALTER TABLE exercicios ADD COLUMN tipo_exercicio TEXT DEFAULT 'forca';
ALTER TABLE exercicios ADD COLUMN subtipo TEXT;
