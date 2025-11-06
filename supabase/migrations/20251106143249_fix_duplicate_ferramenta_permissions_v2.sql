/*
  # Corrigir erro de chave duplicada em permissões de ferramentas

  1. Problema Identificado
    - Existe constraint UNIQUE em (user_id, ferramenta_id)
    - A função DELETE remove apenas permissões do host_id específico
    - Podem existir permissões antigas sem host_id ou de outro host
    - Ao inserir novas permissões, ocorre violação da constraint

  2. Solução
    - Drop e recriar as funções com a correção
    - Remover TODAS as permissões do usuário antes de inserir novas
    - Isso garante que não haverá duplicatas

  3. Segurança
    - Mantém verificação de role do host
    - Mantém todas as validações existentes
*/

-- Drop funções existentes
DROP FUNCTION IF EXISTS public.manage_user_ferramenta_permissions(uuid, uuid, uuid[]);
DROP FUNCTION IF EXISTS public.manage_user_obra_permissions(uuid, uuid, uuid[]);

-- Recriar função de permissões de ferramentas
CREATE FUNCTION public.manage_user_ferramenta_permissions(
  p_host_id uuid,
  p_user_id uuid,
  p_ferramenta_ids uuid[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_host_role text;
  v_permissions_count integer;
BEGIN
  -- Verificar se o host é realmente um host
  SELECT role INTO v_host_role
  FROM users
  WHERE id = p_host_id;

  IF v_host_role IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Host não encontrado'
    );
  END IF;

  IF v_host_role != 'host' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Apenas hosts podem gerenciar permissões'
    );
  END IF;

  -- CORRIGIDO: Remover TODAS as permissões existentes do usuário
  -- (não apenas as do host_id, para evitar duplicatas)
  DELETE FROM user_ferramenta_permissions
  WHERE user_id = p_user_id;

  -- Inserir novas permissões
  IF array_length(p_ferramenta_ids, 1) > 0 THEN
    INSERT INTO user_ferramenta_permissions (user_id, ferramenta_id, host_id)
    SELECT p_user_id, unnest(p_ferramenta_ids), p_host_id;

    GET DIAGNOSTICS v_permissions_count = ROW_COUNT;
  ELSE
    v_permissions_count := 0;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'permissions_count', v_permissions_count
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Recriar função de permissões de obras
CREATE FUNCTION public.manage_user_obra_permissions(
  p_host_id uuid,
  p_user_id uuid,
  p_obra_ids uuid[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_host_role text;
  v_permissions_count integer;
BEGIN
  -- Verificar se o host é realmente um host
  SELECT role INTO v_host_role
  FROM users
  WHERE id = p_host_id;

  IF v_host_role IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Host não encontrado'
    );
  END IF;

  IF v_host_role != 'host' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Apenas hosts podem gerenciar permissões'
    );
  END IF;

  -- CORRIGIDO: Remover TODAS as permissões existentes do usuário
  DELETE FROM user_obra_permissions
  WHERE user_id = p_user_id;

  -- Inserir novas permissões
  IF array_length(p_obra_ids, 1) > 0 THEN
    INSERT INTO user_obra_permissions (user_id, obra_id, host_id)
    SELECT p_user_id, unnest(p_obra_ids), p_host_id;

    GET DIAGNOSTICS v_permissions_count = ROW_COUNT;
  ELSE
    v_permissions_count := 0;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'permissions_count', v_permissions_count
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;
