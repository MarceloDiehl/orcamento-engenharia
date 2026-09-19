package tjrs.dipred.orcamento.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import tjrs.dipred.orcamento.model.Grupo;
import tjrs.dipred.orcamento.model.Subgrupo;

@Repository
public interface SubgrupoRepository extends JpaRepository<Subgrupo, Integer> {
    List<Subgrupo> findAllByGrupoOrderByIdAsc(Grupo grupo);
}
