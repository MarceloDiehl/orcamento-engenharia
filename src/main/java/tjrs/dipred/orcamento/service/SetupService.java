package tjrs.dipred.orcamento.service;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import tjrs.dipred.orcamento.model.Usuario;
import tjrs.dipred.orcamento.repository.UsuarioRepository;

@Service
public class SetupService implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public SetupService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        if (usuarioRepository.findByUsername("admin").isEmpty()) {
            Usuario admin = new Usuario();
            admin.setUsername("admin");
            admin.setNomeCompleto("Administrador");
            admin.setPassword(passwordEncoder.encode("@Dipred26"));
            admin.setSenhaProvisoria(true);

            usuarioRepository.save(admin);
            System.out.println(">>> Usuário ADMIN criado com sucesso com senha criptografada!");
        }
    }
}
