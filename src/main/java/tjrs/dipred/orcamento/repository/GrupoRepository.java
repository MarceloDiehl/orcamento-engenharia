package tjrs.dipred.orcamento.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import tjrs.dipred.orcamento.model.Grupo;

@Repository
public interface GrupoRepository extends JpaRepository<Grupo, Integer> {
    List<Grupo> findAllByOrderByIdAsc();
}
