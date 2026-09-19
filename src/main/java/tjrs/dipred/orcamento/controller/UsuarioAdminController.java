package tjrs.dipred.orcamento.controller;

import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import tjrs.dipred.orcamento.dto.AlterarSenhaDTO;
import tjrs.dipred.orcamento.model.Usuario;
import tjrs.dipred.orcamento.repository.UsuarioRepository;

@RestController
@RequestMapping("/api/admin/usuario")
public class UsuarioAdminController {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioAdminController(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/senha")
    public ResponseEntity<?> alterarSenha(@RequestBody AlterarSenhaDTO dados, Authentication authentication) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findByUsername(authentication.getName());
        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Usuário não encontrado");
        }

        Usuario usuario = usuarioOpt.get();

        if (!passwordEncoder.matches(dados.getSenhaAtual(), usuario.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Senha atual incorreta");
        }

        if (dados.getNovaSenha() == null || dados.getNovaSenha().length() < 6) {
            return ResponseEntity.badRequest().body("A nova senha deve ter pelo menos 6 caracteres");
        }

        usuario.setPassword(passwordEncoder.encode(dados.getNovaSenha()));
        usuario.setSenhaProvisoria(false);
        usuarioRepository.save(usuario);

        return ResponseEntity.ok().build();
    }
}
